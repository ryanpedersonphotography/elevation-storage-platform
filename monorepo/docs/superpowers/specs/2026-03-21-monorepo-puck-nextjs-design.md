# Monorepo with Puck Editor, Next.js Apps, and Shared UI Package

**Date:** 2026-03-21
**Status:** Approved
**OpenSpec Change:** `openspec/changes/monorepo-puck-nextjs-shared-ui/`

## Problem

Multiple client websites (car detailing, real estate, portfolios) live in separate repos with duplicated UI components, inconsistent styling, and no shared design system. Adding visual editing to each site independently multiplies the maintenance burden.

## Solution

A Turborepo monorepo with Bun workspaces containing a shared UI design system, a shared Puck block library, and a clone-ready Next.js template app with integrated Puck visual editing.

## Approach

**Lean scaffold-first:** Minimal Turborepo scaffold → build `packages/ui` and `packages/puck-blocks` → prove them in `apps/_template`. No Storybook — the template app is the test harness.

## Architecture

### Monorepo Structure

```
monorepo/
├── apps/
│   └── _template/              # Next.js 15, App Router, clone-ready
├── packages/
│   ├── ui/                     # @monorepo/ui — design system
│   ├── puck-blocks/            # @monorepo/puck-blocks — Puck components
│   ├── tsconfig/               # @monorepo/tsconfig — shared TS configs
│   └── eslint-config/          # @monorepo/eslint-config — shared lint
├── turbo.json
├── package.json                # "workspaces": ["apps/*", "packages/*"], "packageManager": "bun@1.x"
├── .gitignore
└── .nvmrc                      # Node 20 LTS for Vercel parity
```

**Note:** Bun uses the `"workspaces"` field in root `package.json` (like Yarn). No `pnpm-workspace.yaml` or `bunfig.toml` needed. Root `package.json` also sets `"engines": { "node": ">=20" }` for Vercel deploy parity.

### Dependency Graph

```
apps/_template
  → @monorepo/puck-blocks
    → @monorepo/ui
    → @measured/puck
  → @monorepo/ui
  → @monorepo/tsconfig
  → @monorepo/eslint-config
```

### Tooling Decisions

| Decision | Choice | Over | Rationale |
|----------|--------|------|-----------|
| Monorepo tool | Turborepo | Nx, Lerna | Lightweight, excellent Next.js integration, minimal config |
| Package manager | Bun | pnpm, yarn | Fast installs, built-in workspace support, TypeScript-native |
| Internal packages | Source imports (no build) | npm publish, compiled | All consumers in monorepo; Next.js `transpilePackages` handles it |
| Routing | App Router catch-all | Pages Router, separate admin | Next.js standard; `/edit/[[...path]]` + `/[[...path]]` |
| CSS | Tailwind v4 (CSS-first) | CSS-in-JS, per-app configs, Tailwind v3 | CSS-native `@theme` config, no JS config file, tokens shared via `@import` |
| Color space | OKLCH | HSL | Perceptual uniformity, better for generating accessible client palettes |

## Shared UI Package (`packages/ui`)

### Design Tokens (Tailwind v4 CSS-First)

Tailwind v4 removes `tailwind.config.ts` and the `presets` mechanism. All configuration is CSS-native. Tokens are shared via a CSS file that apps `@import`.

**Shared token file** (`packages/ui/src/tokens.css`):
```css
@theme {
  /* Colors — OKLCH for perceptual uniformity */
  --color-primary: oklch(0.65 0.15 250);
  --color-primary-foreground: oklch(0.98 0 0);
  --color-secondary: oklch(0.75 0.05 250);
  --color-secondary-foreground: oklch(0.98 0 0);
  --color-accent: oklch(0.7 0.18 150);
  --color-accent-foreground: oklch(0.98 0 0);
  --color-background: oklch(0.99 0 0);
  --color-foreground: oklch(0.15 0 0);
  --color-muted: oklch(0.92 0.01 250);
  --color-muted-foreground: oklch(0.55 0.02 250);
  --color-border: oklch(0.88 0.02 250);

  /* Typography */
  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
  --font-heading: "Inter", ui-sans-serif, system-ui, sans-serif;

  /* Spacing scale */
  --spacing-section: 5rem;
  --spacing-container: 2rem;

  /* Border radii */
  --radius-sm: 0.25rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-full: 9999px;

  /* Shadows */
  --shadow-sm: 0 1px 2px oklch(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px oklch(0 0 0 / 0.07);
  --shadow-lg: 0 10px 15px oklch(0 0 0 / 0.1);
}
```

**App consumption** — each client app's `globals.css`:
```css
@import "tailwindcss";
@import "@monorepo/ui/tokens.css";

/* Client-specific overrides */
@theme {
  --color-primary: oklch(0.55 0.2 30);  /* e.g., red for car detailing brand */
}
```

Clients override tokens by re-declaring them in their own `@theme` block after importing the shared base. Tailwind v4 maps `@theme` values directly to utility classes (`bg-primary`, `text-muted-foreground`, etc.).

### Variant System

`cva` (class-variance-authority) for declarative variant maps. `cn()` utility (`clsx` + `tailwind-merge`) in `packages/ui/src/utils.ts` for safe class merging.

### Components

| Component | Purpose | Key Props |
|-----------|---------|-----------|
| `Button` | Action trigger | `variant` (primary/secondary/outline), `size` (sm/md/lg), `asChild` |
| `Heading` | h1-h6 typography | `level` (1-6), `size` |
| `Text` | Body/paragraph | `size`, `muted` |
| `Container` | Max-width wrapper | `size` (sm/md/lg/full) |
| `Section` | Full-width padded section | `className` |
| `Card` | Content card | `className` |

All components forward `ref`, spread HTML attributes, accept `className` via `cn()`.

### Package Config

- Internal package, not published to npm
- `"main"` points to `src/index.ts` (raw TypeScript)
- Exports: all components + `tokens.css` + `cn()` utility
- No build script — consumers transpile via Next.js
- `"use client"` is NOT added to UI components — they remain server-compatible. Only the Puck editor page itself uses `"use client"`.

### Key Dependencies

| Package | Purpose |
|---------|---------|
| `class-variance-authority` | Declarative component variant maps |
| `clsx` | Conditional class joining |
| `tailwind-merge` | Safe Tailwind class deduplication |
| `@radix-ui/react-slot` | Polymorphic `asChild` prop support on Button |

## Puck Blocks Package (`packages/puck-blocks`)

### Block Architecture

Each block is a Puck `ComponentConfig` with `fields`, `defaultProps`, and `render`. Blocks compose `@monorepo/ui` components — no duplicated design primitives. Every block accepts optional `className` for per-instance overrides.

### Standard Blocks

| Block | Fields | UI Components |
|-------|--------|---------------|
| `Hero` | heading, subheading, buttonText, buttonLink, backgroundImage, alignment | Container, Heading, Text, Button |
| `TextBlock` | content (plain textarea, not rich text), alignment | Container, Text |
| `ImageText` | image, imageAlt, text, direction (left/right) | Container, Text |
| `CardGrid` | cards[] (title, desc, image, link), columns (2/3/4) | Container, Card |
| `CallToAction` | heading, text, buttonText, buttonLink, variant | Section, Heading, Text, Button |
| `Spacer` | height (sm/md/lg/xl) | none (pure CSS) |

### Export Pattern

Individual named exports + combined `blocks` record:
```ts
export const blocks = { Hero, TextBlock, ImageText, CardGrid, CallToAction, Spacer };
```
Apps register: `config.components = { ...blocks, ...appSpecificBlocks }`.

The Puck config also includes a `root` configuration for page-level settings (page title, meta description, root wrapper styles). This is defined in `puck-config.ts` in each app.

## Template App (`apps/_template`)

### App Structure

```
apps/_template/
├── src/
│   ├── app/
│   │   ├── layout.tsx                      # Root layout, imports globals.css
│   │   ├── [[...path]]/page.tsx            # Puck render (SSR)
│   │   ├── edit/[[...path]]/page.tsx       # Puck editor ("use client")
│   │   └── api/puck/save/route.ts          # POST handler for editor publish
│   ├── lib/
│   │   ├── puck-config.ts                  # Block registration + root config
│   │   └── puck-data.ts                    # Data layer interface
│   ├── middleware.ts                        # Editor route gating
│   └── styles/globals.css                   # @import tailwindcss + @import tokens.css + client overrides
├── content/index.json                       # Seed page
├── next.config.ts                           # transpilePackages
├── postcss.config.mjs                       # Tailwind v4 PostCSS plugin
├── tsconfig.json                            # extends @monorepo/tsconfig
└── package.json
```

**Note:** No `tailwind.config.ts` — Tailwind v4 is configured entirely through CSS (`globals.css`) and PostCSS. The `postcss.config.mjs` simply enables the `@tailwindcss/postcss` plugin.

### Puck Data Layer

Abstracted behind `PuckDataStore` interface:
- `load(path): Promise<Data | null>` — read page data
- `save(path, data): Promise<void>` — write page data

Initial implementation: JSON files in `content/[path].json`. Swappable to API/DB later.

### Editor Save Flow

Puck `onPublish` → API route `/api/puck/save` → `savePageData()` writes to `content/`.

### Editor Gating

Middleware checks `NODE_ENV`:
- **Development:** editor routes open
- **Production:** requires `EDITOR_SECRET` env var match

### Client Bootstrapping

1. Copy `apps/_template` → `apps/[client-name]`
2. Update `name` in `package.json`
3. Customize OKLCH variables in `globals.css`
4. `turbo dev --filter=@monorepo/[client-name]`

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Puck version coupling across apps | Pin version in root, coordinate upgrades |
| Shared UI breaking changes affect all apps | Turborepo `dependsOn` ensures rebuilds; visual regression testing later |
| Template drift from live apps | Template is starting point, not synced; document customization points |
| Tailwind token conflicts | Apps override tokens in their own `@theme` block after importing shared base; client-specific prefixes if needed |

## Non-Goals

- Migrating existing client sites (future work)
- CMS backend or database (file-based for now)
- Authentication or multi-tenant access control
- Deployment pipeline (Vercel config handled separately)

## Build Order (Foundation First)

1. **Scaffold** — root configs, Turborepo, shared tsconfig/eslint
2. **`packages/ui`** — `tokens.css` with OKLCH `@theme`, `cn()` utility, 6 components
3. **`packages/puck-blocks`** — 6 blocks composing UI components
4. **`apps/_template`** — Next.js app, Puck routes, data layer, seed page
5. **Verification** — `turbo build`, `turbo dev`, editor test, clone test
