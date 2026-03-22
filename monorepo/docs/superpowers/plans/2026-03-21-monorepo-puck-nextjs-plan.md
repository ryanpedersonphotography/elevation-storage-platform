# Monorepo with Puck Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Turborepo monorepo with Bun workspaces containing a shared UI design system (`packages/ui`), a shared Puck block library (`packages/puck-blocks`), and a clone-ready Next.js 15 template app (`apps/_template`) with integrated Puck visual editing.

**Architecture:** Lean scaffold-first — minimal Turborepo root, then build `packages/ui` (OKLCH tokens + 6 components) and `packages/puck-blocks` (6 Puck blocks composing UI components) as the foundation, then prove them in `apps/_template` with Puck editor and render routes. Tailwind v4 CSS-first (no `tailwind.config.ts`), Bun workspaces, internal packages with source imports.

**Tech Stack:** Bun, Turborepo, Next.js 15 (App Router), React 19, Tailwind CSS v4 (CSS-first), @measured/puck, class-variance-authority, clsx, tailwind-merge, @radix-ui/react-slot

**Spec:** `docs/superpowers/specs/2026-03-21-monorepo-puck-nextjs-design.md`

---

## File Map

### Root

| File | Responsibility |
|------|---------------|
| `package.json` | Bun workspaces, Turborepo devDep, engines, packageManager |
| `turbo.json` | Pipeline definitions: build, dev, lint, type-check |
| `.gitignore` | Node/Bun/Next.js ignores |
| `.nvmrc` | Node 20 LTS for Vercel parity |

### `packages/tsconfig/`

| File | Responsibility |
|------|---------------|
| `package.json` | Package metadata |
| `base.json` | Shared base TypeScript config |
| `nextjs.json` | Next.js-specific TS config extending base |
| `library.json` | Library package TS config extending base |

### `packages/eslint-config/`

| File | Responsibility |
|------|---------------|
| `package.json` | Package metadata |
| `next.js` | Shared ESLint config for Next.js apps |
| `library.js` | Shared ESLint config for library packages |

### `packages/ui/`

| File | Responsibility |
|------|---------------|
| `package.json` | Package metadata, deps (cva, clsx, tailwind-merge, @radix-ui/react-slot) |
| `tsconfig.json` | Extends @monorepo/tsconfig/library.json |
| `src/index.ts` | Barrel export: all components + cn utility |
| `src/tokens.css` | Tailwind v4 `@theme` block with OKLCH design tokens |
| `src/utils.ts` | `cn()` utility (clsx + tailwind-merge) |
| `src/components/button.tsx` | Button with cva variants (primary/secondary/outline, sm/md/lg), asChild via Slot |
| `src/components/heading.tsx` | Heading (h1-h6) with level and size props |
| `src/components/text.tsx` | Text/paragraph with size and muted props |
| `src/components/container.tsx` | Max-width wrapper with size variants |
| `src/components/section.tsx` | Full-width padded section |
| `src/components/card.tsx` | Content card |

### `packages/puck-blocks/`

| File | Responsibility |
|------|---------------|
| `package.json` | Package metadata, deps (@measured/puck, @monorepo/ui) |
| `tsconfig.json` | Extends @monorepo/tsconfig/library.json |
| `src/index.ts` | Barrel export: all blocks individually + combined `blocks` object |
| `src/blocks/hero.tsx` | Hero block: heading, subheading, button, background image |
| `src/blocks/text-block.tsx` | TextBlock: plain textarea content |
| `src/blocks/image-text.tsx` | ImageText: image + text with direction toggle |
| `src/blocks/card-grid.tsx` | CardGrid: array of cards with column count |
| `src/blocks/call-to-action.tsx` | CTA: heading, text, button |
| `src/blocks/spacer.tsx` | Spacer: configurable height |

### `apps/_template/`

| File | Responsibility |
|------|---------------|
| `package.json` | Next.js app deps, workspace deps |
| `tsconfig.json` | Extends @monorepo/tsconfig/nextjs.json |
| `next.config.ts` | transpilePackages for internal packages |
| `postcss.config.mjs` | Tailwind v4 PostCSS plugin |
| `src/styles/globals.css` | @import tailwindcss + @import tokens.css + client overrides |
| `src/app/layout.tsx` | Root layout, imports globals.css, html/body wrapper |
| `src/app/[[...path]]/page.tsx` | Puck render route (SSR), loads page data |
| `src/app/edit/[[...path]]/page.tsx` | Puck editor server wrapper (awaits params, loads data) |
| `src/app/edit/[[...path]]/editor-client.tsx` | Puck editor client component ("use client"), onPublish saves data |
| `src/app/api/puck/save/route.ts` | POST handler for editor publish |
| `src/lib/puck-config.tsx` | Puck Config object: shared blocks + root config (`.tsx` — contains JSX in root render) |
| `src/lib/puck-data.ts` | PuckDataStore interface + JSON file implementation |
| `src/middleware.ts` | Editor route gating (dev open, prod requires EDITOR_SECRET) |
| `content/index.json` | Seed page data |

---

## Task 1: Root Scaffold

**Files:**
- Create: `package.json`
- Create: `turbo.json`
- Create: `.gitignore`
- Create: `.nvmrc`

- [ ] **Step 1: Create root `package.json` with Bun workspaces**

```json
{
  "name": "monorepo",
  "private": true,
  "workspaces": ["apps/*", "packages/*"],
  "packageManager": "bun@1.2.5",
  "engines": {
    "node": ">=20"
  },
  "scripts": {
    "build": "turbo build",
    "dev": "turbo dev",
    "lint": "turbo lint",
    "type-check": "turbo type-check"
  },
  "devDependencies": {
    "turbo": "^2"
  }
}
```

- [ ] **Step 2: Create `turbo.json`**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^lint"]
    },
    "type-check": {
      "dependsOn": ["^build"]
    }
  }
}
```

- [ ] **Step 3: Create `.gitignore`**

```
node_modules/
.next/
.turbo/
dist/
out/
*.tsbuildinfo
.env
.env.local
.DS_Store
bun.lock
```

- [ ] **Step 4: Create `.nvmrc`**

```
20
```

- [ ] **Step 5: Run `bun install` to verify workspace setup**

Run: `bun install`
Expected: Installs turbo, creates `bun.lock`

- [ ] **Step 6: Commit**

```bash
git add package.json turbo.json .gitignore .nvmrc bun.lock
git commit -m "feat: scaffold Turborepo monorepo with Bun workspaces"
```

---

## Task 2: Shared TypeScript Config (`packages/tsconfig`)

**Files:**
- Create: `packages/tsconfig/package.json`
- Create: `packages/tsconfig/base.json`
- Create: `packages/tsconfig/nextjs.json`
- Create: `packages/tsconfig/library.json`

- [ ] **Step 1: Create `packages/tsconfig/package.json`**

```json
{
  "name": "@monorepo/tsconfig",
  "version": "0.0.0",
  "private": true
}
```

- [ ] **Step 2: Create `packages/tsconfig/base.json`**

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "bundler",
    "module": "esnext",
    "target": "es2022",
    "lib": ["es2022", "dom", "dom.iterable"],
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "incremental": true
  },
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Create `packages/tsconfig/nextjs.json`**

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "./base.json",
  "compilerOptions": {
    "plugins": [{ "name": "next" }],
    "allowJs": true,
    "noEmit": true
  }
}
```

- [ ] **Step 4: Create `packages/tsconfig/library.json`**

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "./base.json",
  "compilerOptions": {
    "noEmit": true,
    "declaration": true
  }
}
```

- [ ] **Step 5: Run `bun install` from root to link workspace**

Run: `bun install`
Expected: `@monorepo/tsconfig` linked in workspace

- [ ] **Step 6: Commit**

```bash
git add packages/tsconfig/
git commit -m "feat: add shared TypeScript configs (base, nextjs, library)"
```

---

## Task 3: Shared ESLint Config (`packages/eslint-config`)

**Files:**
- Create: `packages/eslint-config/package.json`
- Create: `packages/eslint-config/next.js`
- Create: `packages/eslint-config/library.js`

- [ ] **Step 1: Create `packages/eslint-config/package.json`**

```json
{
  "name": "@monorepo/eslint-config",
  "version": "0.0.0",
  "private": true,
  "dependencies": {
    "eslint-config-next": "^15",
    "eslint-config-prettier": "^10"
  }
}
```

- [ ] **Step 2: Create `packages/eslint-config/next.js`**

```js
/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: ["next/core-web-vitals", "prettier"],
};
```

- [ ] **Step 3: Create `packages/eslint-config/library.js`**

```js
/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: ["prettier"],
  env: {
    node: true,
  },
};
```

- [ ] **Step 4: Run `bun install` from root**

Run: `bun install`
Expected: `@monorepo/eslint-config` linked, ESLint deps installed

- [ ] **Step 5: Commit**

```bash
git add packages/eslint-config/
git commit -m "feat: add shared ESLint configs (next, library)"
```

---

## Task 4: Shared UI Package — Scaffold & Tokens (`packages/ui`)

**Files:**
- Create: `packages/ui/package.json`
- Create: `packages/ui/tsconfig.json`
- Create: `packages/ui/src/tokens.css`
- Create: `packages/ui/src/utils.ts`
- Create: `packages/ui/src/index.ts`

- [ ] **Step 1: Create `packages/ui/package.json`**

```json
{
  "name": "@monorepo/ui",
  "version": "0.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./tokens.css": "./src/tokens.css"
  },
  "dependencies": {
    "class-variance-authority": "^0.7",
    "clsx": "^2",
    "tailwind-merge": "^3",
    "@radix-ui/react-slot": "^1"
  },
  "peerDependencies": {
    "react": "^19",
    "react-dom": "^19"
  },
  "devDependencies": {
    "@monorepo/tsconfig": "workspace:*",
    "typescript": "^5"
  }
}
```

- [ ] **Step 2: Create `packages/ui/tsconfig.json`**

```json
{
  "extends": "@monorepo/tsconfig/library.json",
  "compilerOptions": {
    "outDir": "./dist"
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Create `packages/ui/src/tokens.css`**

Full OKLCH design tokens using Tailwind v4 `@theme`:

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

  /* Spacing */
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

- [ ] **Step 4: Create `packages/ui/src/utils.ts`**

```ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 5: Create `packages/ui/src/index.ts` (empty barrel for now)**

```ts
export { cn } from "./utils";
```

- [ ] **Step 6: Run `bun install` from root**

Run: `bun install`
Expected: All UI deps installed, workspace linked

- [ ] **Step 7: Verify TypeScript compiles**

Run: `cd packages/ui && bunx tsc --noEmit`
Expected: No errors

- [ ] **Step 8: Commit**

```bash
git add packages/ui/
git commit -m "feat: scaffold packages/ui with OKLCH tokens and cn() utility"
```

---

## Task 5: UI Components — Button

**Files:**
- Create: `packages/ui/src/components/button.tsx`
- Modify: `packages/ui/src/index.ts`

- [ ] **Step 1: Create `packages/ui/src/components/button.tsx`**

```tsx
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground hover:bg-primary/90",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/90",
        outline: "border border-border bg-background text-foreground hover:bg-muted",
      },
      size: {
        sm: "h-8 px-3 text-sm",
        md: "h-10 px-4 text-base",
        lg: "h-12 px-6 text-lg",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants, type ButtonProps };
```

- [ ] **Step 2: Add Button export to `packages/ui/src/index.ts`**

```ts
export { cn } from "./utils";
export { Button, buttonVariants, type ButtonProps } from "./components/button";
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `cd packages/ui && bunx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add packages/ui/src/components/button.tsx packages/ui/src/index.ts
git commit -m "feat(ui): add Button component with cva variants and asChild"
```

---

## Task 6: UI Components — Heading & Text

**Files:**
- Create: `packages/ui/src/components/heading.tsx`
- Create: `packages/ui/src/components/text.tsx`
- Modify: `packages/ui/src/index.ts`

- [ ] **Step 1: Create `packages/ui/src/components/heading.tsx`**

```tsx
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../utils";

const headingVariants = cva("font-heading font-bold tracking-tight", {
  variants: {
    size: {
      xs: "text-lg",
      sm: "text-xl",
      md: "text-2xl",
      lg: "text-3xl",
      xl: "text-4xl",
      "2xl": "text-5xl",
    },
  },
});

const defaultSizeForLevel: Record<number, "xs" | "sm" | "md" | "lg" | "xl" | "2xl"> = {
  1: "2xl",
  2: "xl",
  3: "lg",
  4: "md",
  5: "sm",
  6: "xs",
};

type HeadingProps = React.HTMLAttributes<HTMLHeadingElement> &
  VariantProps<typeof headingVariants> & {
    level?: 1 | 2 | 3 | 4 | 5 | 6;
  };

const Heading = React.forwardRef<HTMLHeadingElement, HeadingProps>(
  ({ className, level = 2, size, ...props }, ref) => {
    const Tag = `h${level}` as const;
    const resolvedSize = size ?? defaultSizeForLevel[level];
    return (
      <Tag
        className={cn(headingVariants({ size: resolvedSize, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Heading.displayName = "Heading";

export { Heading, headingVariants, type HeadingProps };
```

- [ ] **Step 2: Create `packages/ui/src/components/text.tsx`**

```tsx
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../utils";

const textVariants = cva("font-sans", {
  variants: {
    size: {
      sm: "text-sm",
      md: "text-base",
      lg: "text-lg",
      xl: "text-xl",
    },
    muted: {
      true: "text-muted-foreground",
      false: "text-foreground",
    },
  },
  defaultVariants: {
    size: "md",
    muted: false,
  },
});

type TextProps = React.HTMLAttributes<HTMLParagraphElement> &
  VariantProps<typeof textVariants>;

const Text = React.forwardRef<HTMLParagraphElement, TextProps>(
  ({ className, size, muted, ...props }, ref) => {
    return (
      <p
        className={cn(textVariants({ size, muted, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Text.displayName = "Text";

export { Text, textVariants, type TextProps };
```

- [ ] **Step 3: Update `packages/ui/src/index.ts`**

```ts
export { cn } from "./utils";
export { Button, buttonVariants, type ButtonProps } from "./components/button";
export { Heading, headingVariants, type HeadingProps } from "./components/heading";
export { Text, textVariants, type TextProps } from "./components/text";
```

- [ ] **Step 4: Verify TypeScript compiles**

Run: `cd packages/ui && bunx tsc --noEmit`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/components/heading.tsx packages/ui/src/components/text.tsx packages/ui/src/index.ts
git commit -m "feat(ui): add Heading and Text typography components"
```

---

## Task 7: UI Components — Container, Section, Card

**Files:**
- Create: `packages/ui/src/components/container.tsx`
- Create: `packages/ui/src/components/section.tsx`
- Create: `packages/ui/src/components/card.tsx`
- Modify: `packages/ui/src/index.ts`

- [ ] **Step 1: Create `packages/ui/src/components/container.tsx`**

```tsx
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../utils";

const containerVariants = cva("mx-auto w-full px-container", {
  variants: {
    size: {
      sm: "max-w-screen-sm",
      md: "max-w-screen-md",
      lg: "max-w-screen-lg",
      full: "max-w-none",
    },
  },
  defaultVariants: {
    size: "lg",
  },
});

type ContainerProps = React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof containerVariants>;

const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, size, ...props }, ref) => {
    return (
      <div
        className={cn(containerVariants({ size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Container.displayName = "Container";

export { Container, containerVariants, type ContainerProps };
```

- [ ] **Step 2: Create `packages/ui/src/components/section.tsx`**

```tsx
import * as React from "react";
import { cn } from "../utils";

type SectionProps = React.HTMLAttributes<HTMLElement>;

const Section = React.forwardRef<HTMLElement, SectionProps>(
  ({ className, ...props }, ref) => {
    return (
      <section
        className={cn("w-full py-section", className)}
        ref={ref}
        {...props}
      />
    );
  }
);
Section.displayName = "Section";

export { Section, type SectionProps };
```

- [ ] **Step 3: Create `packages/ui/src/components/card.tsx`**

```tsx
import * as React from "react";
import { cn } from "../utils";

type CardProps = React.HTMLAttributes<HTMLDivElement>;

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        className={cn(
          "rounded-lg border border-border bg-background p-6 shadow-sm",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Card.displayName = "Card";

export { Card, type CardProps };
```

- [ ] **Step 4: Update `packages/ui/src/index.ts` with all exports**

```ts
export { cn } from "./utils";
export { Button, buttonVariants, type ButtonProps } from "./components/button";
export { Heading, headingVariants, type HeadingProps } from "./components/heading";
export { Text, textVariants, type TextProps } from "./components/text";
export { Container, containerVariants, type ContainerProps } from "./components/container";
export { Section, type SectionProps } from "./components/section";
export { Card, type CardProps } from "./components/card";
```

- [ ] **Step 5: Verify TypeScript compiles**

Run: `cd packages/ui && bunx tsc --noEmit`
Expected: No errors

- [ ] **Step 6: Commit**

```bash
git add packages/ui/src/components/ packages/ui/src/index.ts
git commit -m "feat(ui): add Container, Section, and Card components"
```

---

## Task 8: Puck Blocks Package — Scaffold & Hero Block

**Files:**
- Create: `packages/puck-blocks/package.json`
- Create: `packages/puck-blocks/tsconfig.json`
- Create: `packages/puck-blocks/src/blocks/hero.tsx`
- Create: `packages/puck-blocks/src/index.ts`

- [ ] **Step 1: Create `packages/puck-blocks/package.json`**

```json
{
  "name": "@monorepo/puck-blocks",
  "version": "0.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "dependencies": {
    "@measured/puck": "^0.18",
    "@monorepo/ui": "workspace:*"
  },
  "peerDependencies": {
    "react": "^19",
    "react-dom": "^19"
  },
  "devDependencies": {
    "@monorepo/tsconfig": "workspace:*",
    "typescript": "^5"
  }
}
```

- [ ] **Step 2: Create `packages/puck-blocks/tsconfig.json`**

```json
{
  "extends": "@monorepo/tsconfig/library.json",
  "compilerOptions": {
    "outDir": "./dist"
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Create `packages/puck-blocks/src/blocks/hero.tsx`**

```tsx
import type { ComponentConfig } from "@measured/puck";
import { Container, Heading, Text, Button, Section, cn } from "@monorepo/ui";

export type HeroProps = {
  heading: string;
  subheading: string;
  buttonText: string;
  buttonLink: string;
  backgroundImage: string;
  alignment: "left" | "center" | "right";
  className?: string;
};

export const Hero: ComponentConfig<HeroProps> = {
  fields: {
    heading: { type: "text" },
    subheading: { type: "textarea" },
    buttonText: { type: "text" },
    buttonLink: { type: "text" },
    backgroundImage: { type: "text" },
    alignment: {
      type: "radio",
      options: [
        { label: "Left", value: "left" },
        { label: "Center", value: "center" },
        { label: "Right", value: "right" },
      ],
    },
  },
  defaultProps: {
    heading: "Welcome",
    subheading: "",
    buttonText: "Learn More",
    buttonLink: "#",
    backgroundImage: "",
    alignment: "center",
  },
  render: ({
    heading,
    subheading,
    buttonText,
    buttonLink,
    backgroundImage,
    alignment,
    className,
  }) => {
    const alignClass = {
      left: "text-left",
      center: "text-center",
      right: "text-right",
    }[alignment];

    return (
      <Section
        className={cn("relative", className)}
        style={
          backgroundImage
            ? {
                backgroundImage: `url(${backgroundImage})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : undefined
        }
      >
        <Container className={alignClass}>
          <Heading level={1}>{heading}</Heading>
          {subheading && (
            <Text size="lg" muted className="mt-4">
              {subheading}
            </Text>
          )}
          {buttonText && (
            <div className="mt-8">
              <Button asChild>
                <a href={buttonLink}>{buttonText}</a>
              </Button>
            </div>
          )}
        </Container>
      </Section>
    );
  },
};
```

- [ ] **Step 4: Create `packages/puck-blocks/src/index.ts`**

```ts
export { Hero, type HeroProps } from "./blocks/hero";
```

- [ ] **Step 5: Run `bun install` from root**

Run: `bun install`
Expected: Puck and workspace deps installed

- [ ] **Step 6: Verify TypeScript compiles**

Run: `cd packages/puck-blocks && bunx tsc --noEmit`
Expected: No errors

- [ ] **Step 7: Commit**

```bash
git add packages/puck-blocks/
git commit -m "feat: scaffold puck-blocks package with Hero block"
```

---

## Task 9: Puck Blocks — TextBlock & ImageText

**Files:**
- Create: `packages/puck-blocks/src/blocks/text-block.tsx`
- Create: `packages/puck-blocks/src/blocks/image-text.tsx`
- Modify: `packages/puck-blocks/src/index.ts`

- [ ] **Step 1: Create `packages/puck-blocks/src/blocks/text-block.tsx`**

```tsx
import type { ComponentConfig } from "@measured/puck";
import { Container, Text, cn } from "@monorepo/ui";

export type TextBlockProps = {
  content: string;
  alignment: "left" | "center" | "right";
  className?: string;
};

export const TextBlock: ComponentConfig<TextBlockProps> = {
  fields: {
    content: { type: "textarea" },
    alignment: {
      type: "radio",
      options: [
        { label: "Left", value: "left" },
        { label: "Center", value: "center" },
        { label: "Right", value: "right" },
      ],
    },
  },
  defaultProps: {
    content: "Enter your text here.",
    alignment: "left",
  },
  render: ({ content, alignment, className }) => {
    const alignClass = {
      left: "text-left",
      center: "text-center",
      right: "text-right",
    }[alignment];

    return (
      <Container className={cn("py-8", alignClass, className)}>
        <Text>{content}</Text>
      </Container>
    );
  },
};
```

- [ ] **Step 2: Create `packages/puck-blocks/src/blocks/image-text.tsx`**

```tsx
import type { ComponentConfig } from "@measured/puck";
import { Container, Text, cn } from "@monorepo/ui";

export type ImageTextProps = {
  image: string;
  imageAlt: string;
  text: string;
  direction: "left" | "right";
  className?: string;
};

export const ImageText: ComponentConfig<ImageTextProps> = {
  fields: {
    image: { type: "text" },
    imageAlt: { type: "text" },
    text: { type: "textarea" },
    direction: {
      type: "radio",
      options: [
        { label: "Image Left", value: "left" },
        { label: "Image Right", value: "right" },
      ],
    },
  },
  defaultProps: {
    image: "",
    imageAlt: "",
    text: "Describe your image here.",
    direction: "left",
  },
  render: ({ image, imageAlt, text, direction, className }) => {
    return (
      <Container
        className={cn(
          "grid grid-cols-1 items-center gap-8 py-8 md:grid-cols-2",
          className
        )}
      >
        <div className={direction === "right" ? "order-2" : ""}>
          {image ? (
            <img
              src={image}
              alt={imageAlt}
              className="h-auto w-full rounded-lg"
            />
          ) : (
            <div className="flex aspect-video items-center justify-center rounded-lg bg-muted">
              <Text muted>Image placeholder</Text>
            </div>
          )}
        </div>
        <div className={direction === "right" ? "order-1" : ""}>
          <Text>{text}</Text>
        </div>
      </Container>
    );
  },
};
```

- [ ] **Step 3: Update `packages/puck-blocks/src/index.ts`**

```ts
export { Hero, type HeroProps } from "./blocks/hero";
export { TextBlock, type TextBlockProps } from "./blocks/text-block";
export { ImageText, type ImageTextProps } from "./blocks/image-text";
```

- [ ] **Step 4: Verify TypeScript compiles**

Run: `cd packages/puck-blocks && bunx tsc --noEmit`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add packages/puck-blocks/src/
git commit -m "feat(puck-blocks): add TextBlock and ImageText blocks"
```

---

## Task 10: Puck Blocks — CardGrid, CallToAction, Spacer

**Files:**
- Create: `packages/puck-blocks/src/blocks/card-grid.tsx`
- Create: `packages/puck-blocks/src/blocks/call-to-action.tsx`
- Create: `packages/puck-blocks/src/blocks/spacer.tsx`
- Modify: `packages/puck-blocks/src/index.ts`

- [ ] **Step 1: Create `packages/puck-blocks/src/blocks/card-grid.tsx`**

```tsx
import type { ComponentConfig } from "@measured/puck";
import { Container, Card, Heading, Text, cn } from "@monorepo/ui";

type CardItem = {
  title: string;
  description: string;
  image: string;
  link: string;
};

export type CardGridProps = {
  cards: CardItem[];
  columns: 2 | 3 | 4;
  className?: string;
};

export const CardGrid: ComponentConfig<CardGridProps> = {
  fields: {
    cards: {
      type: "array",
      arrayFields: {
        title: { type: "text" },
        description: { type: "textarea" },
        image: { type: "text" },
        link: { type: "text" },
      },
    },
    columns: {
      type: "select",
      options: [
        { label: "2 Columns", value: 2 },
        { label: "3 Columns", value: 3 },
        { label: "4 Columns", value: 4 },
      ],
    },
  },
  defaultProps: {
    cards: [
      { title: "Card 1", description: "Description", image: "", link: "#" },
      { title: "Card 2", description: "Description", image: "", link: "#" },
      { title: "Card 3", description: "Description", image: "", link: "#" },
    ],
    columns: 3,
  },
  render: ({ cards, columns, className }) => {
    const colsClass = {
      2: "md:grid-cols-2",
      3: "md:grid-cols-3",
      4: "md:grid-cols-4",
    }[columns];

    return (
      <Container className={cn("py-8", className)}>
        <div className={cn("grid grid-cols-1 gap-6", colsClass)}>
          {cards.map((card, i) => (
            <Card key={i}>
              {card.image && (
                <img
                  src={card.image}
                  alt={card.title}
                  className="-mx-6 -mt-6 mb-4 h-48 w-[calc(100%+3rem)] rounded-t-lg object-cover"
                />
              )}
              <Heading level={3} size="sm">
                {card.link ? (
                  <a href={card.link} className="hover:underline">
                    {card.title}
                  </a>
                ) : (
                  card.title
                )}
              </Heading>
              <Text muted className="mt-2">
                {card.description}
              </Text>
            </Card>
          ))}
        </div>
      </Container>
    );
  },
};
```

- [ ] **Step 2: Create `packages/puck-blocks/src/blocks/call-to-action.tsx`**

```tsx
import type { ComponentConfig } from "@measured/puck";
import { Section, Container, Heading, Text, Button, cn } from "@monorepo/ui";

export type CallToActionProps = {
  heading: string;
  text: string;
  buttonText: string;
  buttonLink: string;
  variant: "default" | "accent";
  className?: string;
};

export const CallToAction: ComponentConfig<CallToActionProps> = {
  fields: {
    heading: { type: "text" },
    text: { type: "textarea" },
    buttonText: { type: "text" },
    buttonLink: { type: "text" },
    variant: {
      type: "radio",
      options: [
        { label: "Default", value: "default" },
        { label: "Accent", value: "accent" },
      ],
    },
  },
  defaultProps: {
    heading: "Ready to get started?",
    text: "Contact us today.",
    buttonText: "Get in Touch",
    buttonLink: "#",
    variant: "default",
  },
  render: ({ heading, text, buttonText, buttonLink, variant, className }) => {
    return (
      <Section
        className={cn(
          variant === "accent" ? "bg-accent text-accent-foreground" : "bg-muted",
          className
        )}
      >
        <Container className="text-center">
          <Heading level={2}>{heading}</Heading>
          <Text className="mt-4" muted={variant !== "accent"}>
            {text}
          </Text>
          <div className="mt-8">
            <Button
              variant={variant === "accent" ? "outline" : "primary"}
              asChild
            >
              <a href={buttonLink}>{buttonText}</a>
            </Button>
          </div>
        </Container>
      </Section>
    );
  },
};
```

- [ ] **Step 3: Create `packages/puck-blocks/src/blocks/spacer.tsx`**

```tsx
import type { ComponentConfig } from "@measured/puck";
import { cn } from "@monorepo/ui";

export type SpacerProps = {
  height: "sm" | "md" | "lg" | "xl";
  className?: string;
};

export const Spacer: ComponentConfig<SpacerProps> = {
  fields: {
    height: {
      type: "select",
      options: [
        { label: "Small (2rem)", value: "sm" },
        { label: "Medium (4rem)", value: "md" },
        { label: "Large (6rem)", value: "lg" },
        { label: "Extra Large (8rem)", value: "xl" },
      ],
    },
  },
  defaultProps: {
    height: "md",
  },
  render: ({ height, className }) => {
    const heightClass = {
      sm: "h-8",
      md: "h-16",
      lg: "h-24",
      xl: "h-32",
    }[height];

    return <div className={cn(heightClass, className)} aria-hidden="true" />;
  },
};
```

- [ ] **Step 4: Update `packages/puck-blocks/src/index.ts` with all exports + combined blocks object**

```ts
import { Hero } from "./blocks/hero";
import { TextBlock } from "./blocks/text-block";
import { ImageText } from "./blocks/image-text";
import { CardGrid } from "./blocks/card-grid";
import { CallToAction } from "./blocks/call-to-action";
import { Spacer } from "./blocks/spacer";

export { Hero, type HeroProps } from "./blocks/hero";
export { TextBlock, type TextBlockProps } from "./blocks/text-block";
export { ImageText, type ImageTextProps } from "./blocks/image-text";
export { CardGrid, type CardGridProps } from "./blocks/card-grid";
export { CallToAction, type CallToActionProps } from "./blocks/call-to-action";
export { Spacer, type SpacerProps } from "./blocks/spacer";

export const blocks = { Hero, TextBlock, ImageText, CardGrid, CallToAction, Spacer };
```

- [ ] **Step 5: Verify TypeScript compiles**

Run: `cd packages/puck-blocks && bunx tsc --noEmit`
Expected: No errors

- [ ] **Step 6: Commit**

```bash
git add packages/puck-blocks/src/
git commit -m "feat(puck-blocks): add CardGrid, CallToAction, and Spacer blocks"
```

---

## Task 11: Template App — Scaffold & Config

**Files:**
- Create: `apps/_template/package.json`
- Create: `apps/_template/tsconfig.json`
- Create: `apps/_template/next.config.ts`
- Create: `apps/_template/postcss.config.mjs`
- Create: `apps/_template/src/styles/globals.css`

- [ ] **Step 1: Create `apps/_template/package.json`**

```json
{
  "name": "@monorepo/template",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "@measured/puck": "^0.18",
    "@monorepo/puck-blocks": "workspace:*",
    "@monorepo/ui": "workspace:*",
    "next": "^15",
    "react": "^19",
    "react-dom": "^19"
  },
  "devDependencies": {
    "@monorepo/eslint-config": "workspace:*",
    "@monorepo/tsconfig": "workspace:*",
    "@tailwindcss/postcss": "^4",
    "@types/node": "^22",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "tailwindcss": "^4",
    "typescript": "^5"
  }
}
```

- [ ] **Step 2: Create `apps/_template/tsconfig.json`**

```json
{
  "extends": "@monorepo/tsconfig/nextjs.json",
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "src/**/*.ts", "src/**/*.tsx", "*.ts", "*.mjs"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Create `apps/_template/next.config.ts`**

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@monorepo/ui", "@monorepo/puck-blocks"],
};

export default nextConfig;
```

- [ ] **Step 4: Create `apps/_template/postcss.config.mjs`**

```js
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
```

- [ ] **Step 5: Create `apps/_template/src/styles/globals.css`**

```css
@import "tailwindcss";
@import "@monorepo/ui/tokens.css";

/* Client-specific overrides — customize these for each client */
@theme {
  /* Override primary color for this client's brand */
  /* --color-primary: oklch(0.55 0.2 30); */
}
```

- [ ] **Step 6: Run `bun install` from root**

Run: `bun install`
Expected: All template deps installed

- [ ] **Step 7: Commit**

```bash
git add apps/_template/package.json apps/_template/tsconfig.json apps/_template/next.config.ts apps/_template/postcss.config.mjs apps/_template/src/styles/globals.css
git commit -m "feat: scaffold template app with Next.js 15, Tailwind v4 CSS-first config"
```

---

## Task 12: Template App — Layout, Data Layer, Puck Config

**Files:**
- Create: `apps/_template/src/app/layout.tsx`
- Create: `apps/_template/src/lib/puck-data.ts`
- Create: `apps/_template/src/lib/puck-config.ts`
- Create: `apps/_template/content/index.json`

- [ ] **Step 1: Create `apps/_template/src/app/layout.tsx`**

```tsx
import type { Metadata } from "next";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "Client Site",
  description: "Built with Puck visual editor",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Create `apps/_template/src/lib/puck-data.ts`**

```ts
import type { Data } from "@measured/puck";
import fs from "node:fs/promises";
import path from "node:path";

export interface PuckDataStore {
  load(pagePath: string): Promise<Data | null>;
  save(pagePath: string, data: Data): Promise<void>;
}

const CONTENT_DIR = path.join(process.cwd(), "content");

function getFilePath(pagePath: string): string {
  const normalized = pagePath === "/" || pagePath === "" ? "index" : pagePath.replace(/^\//, "").replace(/\//g, "-");
  return path.join(CONTENT_DIR, `${normalized}.json`);
}

export const fileStore: PuckDataStore = {
  async load(pagePath) {
    const filePath = getFilePath(pagePath);
    try {
      const raw = await fs.readFile(filePath, "utf-8");
      return JSON.parse(raw) as Data;
    } catch {
      return null;
    }
  },

  async save(pagePath, data) {
    const filePath = getFilePath(pagePath);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
  },
};

export const dataStore: PuckDataStore = fileStore;
```

- [ ] **Step 3: Create `apps/_template/src/lib/puck-config.tsx`**

Note: This file uses `.tsx` extension because the `root.render` function contains JSX.

```tsx
import type { Config } from "@measured/puck";
import { blocks } from "@monorepo/puck-blocks";

export const puckConfig: Config = {
  components: {
    ...blocks,
  },
  root: {
    fields: {
      title: { type: "text" },
      description: { type: "textarea" },
    },
    defaultProps: {
      title: "Page Title",
      description: "",
    },
    render: ({ children, title }) => {
      return (
        <>
          <title>{title}</title>
          <main>{children}</main>
        </>
      );
    },
  },
};
```

- [ ] **Step 4: Create `apps/_template/content/index.json`**

```json
{
  "root": {
    "props": {
      "title": "Home",
      "description": "Welcome to the site"
    }
  },
  "content": [
    {
      "type": "Hero",
      "props": {
        "id": "hero-1",
        "heading": "Welcome to Your Site",
        "subheading": "Built with Puck visual editor. Edit this page at /edit.",
        "buttonText": "Open Editor",
        "buttonLink": "/edit",
        "backgroundImage": "",
        "alignment": "center"
      }
    },
    {
      "type": "Spacer",
      "props": {
        "id": "spacer-1",
        "height": "md"
      }
    },
    {
      "type": "CallToAction",
      "props": {
        "id": "cta-1",
        "heading": "Ready to customize?",
        "text": "Navigate to /edit to start building your pages visually.",
        "buttonText": "Start Editing",
        "buttonLink": "/edit",
        "variant": "default"
      }
    }
  ]
}
```

- [ ] **Step 5: Commit**

```bash
git add apps/_template/src/app/layout.tsx apps/_template/src/lib/ apps/_template/content/
git commit -m "feat(template): add layout, Puck data layer, config, and seed page"
```

---

## Task 13: Template App — Puck Render & Editor Routes

**Files:**
- Create: `apps/_template/src/app/[[...path]]/page.tsx`
- Create: `apps/_template/src/app/edit/[[...path]]/page.tsx`
- Create: `apps/_template/src/app/edit/[[...path]]/editor-client.tsx`
- Create: `apps/_template/src/app/api/puck/save/route.ts`

- [ ] **Step 1: Create `apps/_template/src/app/[[...path]]/page.tsx`**

Puck render route — server component, loads page data and renders with Puck `<Render>`:

```tsx
import { Render } from "@measured/puck";
import { notFound } from "next/navigation";
import { puckConfig } from "@/lib/puck-config";
import { dataStore } from "@/lib/puck-data";

type Params = Promise<{ path?: string[] }>;

export default async function PuckPage({ params }: { params: Params }) {
  const { path } = await params;
  const pagePath = path ? `/${path.join("/")}` : "/";
  const data = await dataStore.load(pagePath);

  if (!data) {
    notFound();
  }

  return <Render config={puckConfig} data={data} />;
}
```

- [ ] **Step 2: Create `apps/_template/src/app/edit/[[...path]]/page.tsx`**

Server component wrapper — awaits params and loads data, passes to client component:

```tsx
import { EditorClient } from "./editor-client";
import { dataStore } from "@/lib/puck-data";

type Params = Promise<{ path?: string[] }>;

export default async function EditPage({ params }: { params: Params }) {
  const { path } = await params;
  const pagePath = path ? `/${path.join("/")}` : "/";
  const data = await dataStore.load(pagePath);
  return <EditorClient pagePath={pagePath} initialData={data} />;
}
```

- [ ] **Step 3 (new): Create `apps/_template/src/app/edit/[[...path]]/editor-client.tsx`**

Client component — renders the Puck editor:

```tsx
"use client";

import { Puck } from "@measured/puck";
import "@measured/puck/puck.css";
import { puckConfig } from "@/lib/puck-config";
import type { Data } from "@measured/puck";

export function EditorClient({
  pagePath,
  initialData,
}: {
  pagePath: string;
  initialData: Data | null;
}) {
  const handlePublish = async (data: Data) => {
    await fetch("/api/puck/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: pagePath, data }),
    });
    window.location.href = pagePath;
  };

  return (
    <Puck
      config={puckConfig}
      data={initialData ?? { root: { props: { title: "New Page" } }, content: [] }}
      onPublish={handlePublish}
    />
  );
}
```

- [ ] **Step 3: Create `apps/_template/src/app/api/puck/save/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import { dataStore } from "@/lib/puck-data";

export async function GET(request: NextRequest) {
  const pagePath = request.nextUrl.searchParams.get("path") || "/";
  const data = await dataStore.load(pagePath);

  if (!data) {
    return NextResponse.json(null, { status: 404 });
  }

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { path: pagePath, data } = body;

  if (!pagePath || !data) {
    return NextResponse.json({ error: "Missing path or data" }, { status: 400 });
  }

  await dataStore.save(pagePath, data);
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/_template/src/app/
git commit -m "feat(template): add Puck render route, editor route, and save API"
```

---

## Task 14: Template App — Middleware & Final Wiring

**Files:**
- Create: `apps/_template/src/middleware.ts`

- [ ] **Step 1: Create `apps/_template/src/middleware.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  // In development, allow all editor access
  if (process.env.NODE_ENV === "development") {
    return NextResponse.next();
  }

  // In production, require EDITOR_SECRET
  const editorSecret = process.env.EDITOR_SECRET;
  if (!editorSecret) {
    return new NextResponse("Editor not configured", { status: 503 });
  }

  const authHeader = request.headers.get("x-editor-secret");
  const authCookie = request.cookies.get("editor-secret")?.value;

  if (authHeader === editorSecret || authCookie === editorSecret) {
    return NextResponse.next();
  }

  return new NextResponse("Unauthorized", { status: 401 });
}

export const config = {
  matcher: ["/edit/:path*", "/api/puck/:path*"],
};
```

- [ ] **Step 2: Commit**

```bash
git add apps/_template/src/middleware.ts
git commit -m "feat(template): add editor route middleware gating"
```

---

## Task 15: Verification

- [ ] **Step 1: Run `bun install` from root**

Run: `bun install`
Expected: All workspace packages linked, no errors

- [ ] **Step 2: Run `turbo build`**

Run: `bunx turbo build`
Expected: Template app builds successfully. Output shows all packages in the dependency graph processed.

- [ ] **Step 3: Run `turbo dev` and verify template app starts**

Run: `bunx turbo dev --filter=@monorepo/template`
Expected: Next.js dev server starts on localhost:3000

- [ ] **Step 4: Verify home page renders**

Open `http://localhost:3000` in browser.
Expected: Hero block renders with "Welcome to Your Site" heading and "Open Editor" button. CTA block renders below.

- [ ] **Step 5: Verify editor loads**

Open `http://localhost:3000/edit` in browser.
Expected: Puck editor loads with all 6 blocks in the component picker (Hero, TextBlock, ImageText, CardGrid, CallToAction, Spacer). The seed page content is loaded in the canvas.

- [ ] **Step 6: Test editor publish flow**

In the Puck editor:
1. Drag a new TextBlock onto the page
2. Edit the content text
3. Click "Publish"
Expected: Page saves, browser redirects to `/`, new TextBlock appears on the rendered page. File `content/index.json` is updated with the new block.

- [ ] **Step 7: Test client bootstrapping**

Run:
```bash
cp -r apps/_template apps/test-client
```
Then edit `apps/test-client/package.json` — change `"name"` to `"@monorepo/test-client"`.

Run: `bun install && bunx turbo dev --filter=@monorepo/test-client`
Expected: Test client starts on its own port, renders the same seed page.

- [ ] **Step 8: Clean up test client and final commit**

```bash
rm -rf apps/test-client
git add -A
git commit -m "feat: complete monorepo with Puck editor — all packages verified"
```
