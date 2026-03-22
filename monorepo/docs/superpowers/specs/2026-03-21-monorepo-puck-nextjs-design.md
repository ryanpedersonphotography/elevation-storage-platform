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
├── package.json                # workspaces, packageManager: bun
├── .gitignore
└── .nvmrc                      # Node 20 LTS for Vercel parity
```

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
| CSS | Tailwind v4 + shared preset | CSS-in-JS, per-app configs | Consistent tokens, client-extensible |
| Color space | OKLCH | HSL | Perceptual uniformity, better for generating accessible client palettes |

## Shared UI Package (`packages/ui`)

### Design Tokens

Semantic OKLCH CSS variables that each client overrides for branding:

```css
:root {
  --primary: 0.65 0.15 250;        /* oklch lightness chroma hue */
  --primary-foreground: 0.98 0 0;
  --secondary: 0.75 0.05 250;
  --accent: 0.7 0.18 150;
  --background: 0.99 0 0;
  --foreground: 0.15 0 0;
  --muted: 0.92 0.01 250;
  --muted-foreground: 0.55 0.02 250;
  --border: 0.88 0.02 250;
}
```

Tailwind preset maps these to utility classes via `oklch(var(--primary))`.

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
- Exports: all components + `tailwind-preset.ts` + `cn()` utility
- No build script — consumers transpile via Next.js

## Puck Blocks Package (`packages/puck-blocks`)

### Block Architecture

Each block is a Puck `ComponentConfig` with `fields`, `defaultProps`, and `render`. Blocks compose `@monorepo/ui` components — no duplicated design primitives. Every block accepts optional `className` for per-instance overrides.

### Standard Blocks

| Block | Fields | UI Components |
|-------|--------|---------------|
| `Hero` | heading, subheading, buttonText, buttonLink, backgroundImage, alignment | Container, Heading, Text, Button |
| `TextBlock` | content (textarea), alignment | Container, Text |
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

## Template App (`apps/_template`)

### App Structure

```
apps/_template/
├── src/
│   ├── app/
│   │   ├── layout.tsx                  # Root layout
│   │   ├── [[...path]]/page.tsx        # Puck render (SSR)
│   │   └── edit/[[...path]]/page.tsx   # Puck editor (client)
│   ├── lib/
│   │   ├── puck-config.ts             # Block registration
│   │   └── puck-data.ts               # Data layer interface
│   └── styles/globals.css              # OKLCH vars + Tailwind
├── content/index.json                  # Seed page
├── next.config.ts                      # transpilePackages
├── tailwind.config.ts                  # extends @monorepo/ui preset
├── tsconfig.json                       # extends @monorepo/tsconfig
└── package.json
```

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
| Tailwind preset conflicts | Apps extend (not override) preset; client-specific prefixes if needed |

## Non-Goals

- Migrating existing client sites (future work)
- CMS backend or database (file-based for now)
- Authentication or multi-tenant access control
- Deployment pipeline (Vercel config handled separately)

## Build Order (Foundation First)

1. **Scaffold** — root configs, Turborepo, shared tsconfig/eslint
2. **`packages/ui`** — Tailwind preset, OKLCH tokens, `cn()`, 6 components
3. **`packages/puck-blocks`** — 6 blocks composing UI components
4. **`apps/_template`** — Next.js app, Puck routes, data layer, seed page
5. **Verification** — `turbo build`, `turbo dev`, editor test, clone test
