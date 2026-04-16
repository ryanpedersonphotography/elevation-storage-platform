# Elevation Group Storage Platform Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a modular Next.js 15 platform that renders storage facility websites from JSON config files, deployed as static sites on Netlify.

**Architecture:** Turborepo monorepo with two Next.js apps (umbrella + standalone) sharing a component library (`packages/storage-ui`) and config package (`packages/facility-config`). Components follow a 4-layer hierarchy (primitives → compositions → sections → renderer). Facility data lives in JSON files validated by Zod at build time.

**Tech Stack:** Turborepo, Bun, Next.js 15, React 19, Tailwind CSS v4, CVA, Zod, Vitest, Playwright, Lucide React

**Spec:** `docs/superpowers/specs/2026-04-15-elevation-storage-platform-design.md`

---

## Phase 1: Monorepo Scaffold

### Task 1: Initialize Turborepo monorepo

**Files:**
- Create: `package.json`
- Create: `turbo.json`
- Create: `.gitignore`
- Create: `packages/tsconfig/base.json`
- Create: `packages/tsconfig/nextjs.json`
- Create: `packages/tsconfig/library.json`
- Create: `packages/tsconfig/package.json`

- [ ] **Step 1: Initialize root package.json**

```json
{
  "name": "jerry-template",
  "private": true,
  "workspaces": ["apps/*", "packages/*"],
  "packageManager": "bun@1.2.5",
  "scripts": {
    "build": "turbo build",
    "dev": "turbo dev",
    "lint": "turbo lint",
    "type-check": "turbo type-check",
    "validate": "turbo validate"
  }
}
```

- [ ] **Step 2: Create turbo.json**

```jsonc
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "validate": {
      "inputs": ["../../data/facilities/*.json"],
      "outputs": []
    },
    "build": {
      "dependsOn": ["^build", "validate"],
      "outputs": [".next/**", "out/**"],
      "env": ["FACILITY_SLUG"]
    },
    "dev": { "persistent": true, "cache": false },
    "lint": { "dependsOn": ["^lint"] },
    "type-check": { "dependsOn": ["^build"] },
    "test": { "dependsOn": ["^build"] }
  }
}
```

- [ ] **Step 3: Create .gitignore**

```
node_modules
.next
out
.turbo
dist
.superpowers
```

- [ ] **Step 4: Create shared tsconfig packages**

`packages/tsconfig/base.json`:
```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "bundler",
    "module": "ESNext",
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "isolatedModules": true,
    "resolveJsonModule": true
  },
  "exclude": ["node_modules"]
}
```

`packages/tsconfig/nextjs.json`:
```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "./base.json",
  "compilerOptions": {
    "plugins": [{ "name": "next" }],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowJs": true,
    "noEmit": true
  }
}
```

`packages/tsconfig/library.json`:
```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "./base.json",
  "compilerOptions": {
    "outDir": "./dist"
  }
}
```

`packages/tsconfig/package.json`:
```json
{
  "name": "@jerry/tsconfig",
  "private": true
}
```

- [ ] **Step 5: Install root dependencies and verify**

Run: `bun add -d turbo && bun install`
Expected: lockfile created, no errors

- [ ] **Step 6: Commit**

```bash
git add package.json turbo.json .gitignore packages/tsconfig/
git commit -m "feat: initialize Turborepo monorepo with shared tsconfig"
```

---

### Task 2: Scaffold facility-config package

**Files:**
- Create: `packages/facility-config/package.json`
- Create: `packages/facility-config/tsconfig.json`
- Create: `packages/facility-config/src/index.ts`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "@jerry/facility-config",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "type-check": "tsc --noEmit",
    "test": "vitest run",
    "validate": "bun run src/validate.ts"
  },
  "dependencies": {
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "@jerry/tsconfig": "workspace:*",
    "typescript": "^5",
    "vitest": "^3"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "extends": "@jerry/tsconfig/library.json",
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 3: Create empty barrel export**

`packages/facility-config/src/index.ts`:
```ts
// Barrel export — filled in Task 3
export {}
```

- [ ] **Step 4: Install and verify**

Run: `bun install`
Expected: workspace linked, no errors

- [ ] **Step 5: Commit**

```bash
git add packages/facility-config/
git commit -m "feat: scaffold facility-config package"
```

---

### Task 3: Implement Zod schemas and validation

**Files:**
- Create: `packages/facility-config/src/schema.ts`
- Create: `packages/facility-config/src/types.ts`
- Create: `packages/facility-config/src/loader.ts`
- Create: `packages/facility-config/src/validate.ts`
- Modify: `packages/facility-config/src/index.ts`
- Create: `data/facilities/smithtown.json`
- Create: `data/fixtures/test-facility.json`
- Create: `packages/facility-config/src/__tests__/schema.test.ts`

- [ ] **Step 1: Write schema tests (failing)**

`packages/facility-config/src/__tests__/schema.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { FacilitySchema } from '../schema'

const validFacility = {
  slug: 'test-facility',
  name: 'Test Self Storage',
  info: {
    address: { street: '123 Main St', city: 'Testville', state: 'NY', zip: '10001' },
    phone: '(555) 123-4567',
    email: 'test@example.com',
    coordinates: { lat: 40.0, lng: -74.0 },
    hours: [
      { days: ['Mo', 'Tu', 'We', 'Th', 'Fr'], open: '06:00', close: '21:00' },
      { days: ['Sa', 'Su'], open: '08:00', close: '18:00' },
    ],
  },
  branding: {
    showParent: true,
    template: 'modern',
    colors: { primary: 'oklch(0.55 0.15 250)', accent: 'oklch(0.7 0.18 30)' },
    logo: '/images/test/logo.png',
  },
  deployment: { mode: 'subdirectory', domain: null },
  seo: {
    siteName: 'Test Self Storage',
    defaultTitle: 'Test Self Storage',
    defaultDescription: 'A test facility.',
    keywords: ['test'],
    ogImage: '/images/test/og.jpg',
  },
  analytics: {
    gtag: 'G-TEST123',
    gtagEvents: { reserve_click: true, phone_click: false, directions_click: true },
  },
  pages: {
    home: {
      enabled: true,
      seo: { title: 'Home', description: 'Home page' },
      layout: ['hero'],
      sections: {
        hero: {
          component: 'Hero',
          content: {
            heading: 'Welcome',
            image: { src: '/images/test/hero.jpg', alt: 'Hero' },
          },
        },
      },
    },
    reviews: { enabled: false, seo: {}, layout: [], sections: {} },
  },
  data: {
    units: [{ id: '5x5-indoor', size: '5x5', sqft: 25, price: 49, features: ['indoor'] }],
    amenities: [{ id: '24hr', label: '24-Hour Access', icon: 'clock', description: 'Always open' }],
    testimonials: [{ name: 'Jane', rating: 5, text: 'Great!' }],
  },
  integrations: {},
}

describe('FacilitySchema', () => {
  it('accepts a valid facility config', () => {
    const result = FacilitySchema.safeParse(validFacility)
    expect(result.success).toBe(true)
  })

  it('rejects invalid OKLCH color', () => {
    const bad = structuredClone(validFacility)
    bad.branding.colors.primary = 'red; } body { display: none'
    const result = FacilitySchema.safeParse(bad)
    expect(result.success).toBe(false)
  })

  it('rejects layout key missing from sections', () => {
    const bad = structuredClone(validFacility)
    bad.pages.home.layout = ['hero', 'missing']
    const result = FacilitySchema.safeParse(bad)
    expect(result.success).toBe(false)
    expect(result.error?.issues.some(i => i.message.includes('missing'))).toBe(true)
  })

  it('rejects duplicate layout keys', () => {
    const bad = structuredClone(validFacility)
    bad.pages.home.layout = ['hero', 'hero']
    bad.pages.home.sections = {
      hero: {
        component: 'Hero',
        content: { heading: 'Hi', image: { src: '/x.jpg', alt: '' } },
      },
    }
    const result = FacilitySchema.safeParse(bad)
    expect(result.success).toBe(false)
    expect(result.error?.issues.some(i => i.message.includes('Duplicate'))).toBe(true)
  })

  it('rejects invalid variant for component', () => {
    const bad = structuredClone(validFacility)
    bad.pages.home.sections.hero = {
      component: 'Hero',
      variant: 'nonexistent',
      content: { heading: 'Hi', image: { src: '/x.jpg', alt: '' } },
    }
    const result = FacilitySchema.safeParse(bad)
    expect(result.success).toBe(false)
    expect(result.error?.issues.some(i => i.message.includes('nonexistent'))).toBe(true)
  })

  it('skips cross-validation for disabled pages', () => {
    const result = FacilitySchema.safeParse(validFacility)
    expect(result.success).toBe(true) // reviews is disabled with empty layout/sections
  })

  it('rejects malformed hours', () => {
    const bad = structuredClone(validFacility)
    bad.info.hours = [{ days: ['Mo'], open: '6am', close: '9pm' }]
    const result = FacilitySchema.safeParse(bad)
    expect(result.success).toBe(false)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd packages/facility-config && bun run test`
Expected: FAIL — `FacilitySchema` not found

- [ ] **Step 3: Implement schema.ts**

`packages/facility-config/src/schema.ts`:
```ts
import { z } from 'zod'

// --- Shared schemas ---

const OklchSchema = z.string().regex(
  /^oklch\(\s*[\d.]+\s+[\d.]+\s+[\d.]+\s*\)$/,
  'Must be a valid oklch() value, e.g. oklch(0.55 0.15 250)'
)

const ImageSchema = z.object({
  src: z.string().min(1),
  alt: z.string(),
})

const CTASchema = z.object({
  label: z.string().min(1),
  href: z.string().min(1),
  variant: z.enum(['primary', 'secondary', 'outline', 'ghost']),
})

const HoursSchema = z.object({
  days: z.array(z.enum(['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'])).min(1),
  open: z.string().regex(/^\d{2}:\d{2}$/),
  close: z.string().regex(/^\d{2}:\d{2}$/),
})

const UnitSchema = z.object({
  id: z.string().min(1),
  size: z.string().min(1),
  sqft: z.number().positive(),
  price: z.number().nonnegative(),
  features: z.array(z.string()),
})

const AmenitySchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  icon: z.string().min(1),
  description: z.string().min(1),
})

const TestimonialSchema = z.object({
  name: z.string().min(1),
  rating: z.number().min(1).max(5),
  text: z.string().min(1),
})

// --- Component validation ---

const componentNames = [
  'Hero', 'HeroSimple', 'ContentSection', 'UnitGrid', 'FeatureGrid',
  'CallToAction', 'ContactForm', 'MapSection', 'TestimonialGrid',
  'SizeGuide', 'FacilityDirectory',
] as const

const ComponentName = z.enum(componentNames)

const variantsByComponent: Record<string, string[]> = {
  Hero: ['overlay', 'split', 'wave'],
  HeroSimple: ['minimal', 'colored'],
  ContentSection: ['clean', 'bordered', 'soft'],
  UnitGrid: ['cards', 'table', 'compact'],
  FeatureGrid: ['icons', 'cards', 'pills'],
  CallToAction: ['gradient', 'solid', 'rounded'],
  ContactForm: ['standard', 'minimal'],
  MapSection: ['embedded', 'static'],
  TestimonialGrid: ['cards', 'quotes'],
  SizeGuide: ['visual', 'table'],
  FacilityDirectory: ['cards', 'list', 'map'],
}

const layoutValues = [
  'centered', 'left-aligned', 'image-right', 'image-left',
  'stacked', 'full-width', '2-col', '3-col', '4-col',
] as const

const SectionSchema = z.object({
  component: ComponentName,
  variant: z.string().optional(),
  layout: z.enum(layoutValues).optional(),
  content: z.record(z.unknown()),
}).superRefine((section, ctx) => {
  const allowed = variantsByComponent[section.component]
  if (section.variant && allowed && !allowed.includes(section.variant)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Invalid variant "${section.variant}" for ${section.component}. Allowed: ${allowed.join(', ')}`,
    })
  }
})

// --- Page schema ---

const PageSeoSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  ogImage: z.string().optional(),
}).optional()

const PageSchema = z.object({
  enabled: z.boolean(),
  seo: PageSeoSchema,
  layout: z.array(z.string()),
  sections: z.record(SectionSchema),
}).superRefine((page, ctx) => {
  if (!page.enabled) return

  const seen = new Set<string>()
  for (const key of page.layout) {
    if (seen.has(key)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Duplicate section key "${key}" in layout array`,
      })
    }
    seen.add(key)
  }

  for (const key of page.layout) {
    if (!(key in page.sections)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Layout references section "${key}" but it is not defined in sections`,
      })
    }
  }

  for (const key of Object.keys(page.sections)) {
    if (!page.layout.includes(key)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Section "${key}" is defined but not referenced in layout (dead section)`,
      })
    }
  }
})

// --- Facility schema ---

export const FacilitySchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  info: z.object({
    address: z.object({
      street: z.string().min(1),
      city: z.string().min(1),
      state: z.string().min(1),
      zip: z.string().min(1),
    }),
    phone: z.string().min(1),
    email: z.string().email(),
    coordinates: z.object({ lat: z.number(), lng: z.number() }),
    hours: z.array(HoursSchema).min(1),
  }),
  branding: z.object({
    showParent: z.boolean(),
    template: z.enum(['modern', 'bold', 'friendly']),
    colors: z.object({
      primary: OklchSchema,
      accent: OklchSchema,
    }),
    logo: z.string().min(1),
  }),
  deployment: z.object({
    mode: z.enum(['subdirectory', 'standalone']),
    domain: z.string().nullable(),
  }),
  seo: z.object({
    siteName: z.string().min(1),
    defaultTitle: z.string().min(1),
    defaultDescription: z.string().min(1),
    keywords: z.array(z.string()),
    ogImage: z.string().min(1),
  }),
  analytics: z.object({
    gtag: z.string().nullable().optional(),
    gtagEvents: z.object({
      reserve_click: z.boolean(),
      phone_click: z.boolean(),
      directions_click: z.boolean(),
    }).optional(),
  }).optional(),
  pages: z.record(PageSchema),
  data: z.object({
    units: z.array(UnitSchema),
    amenities: z.array(AmenitySchema),
    testimonials: z.array(TestimonialSchema),
  }),
  integrations: z.record(z.never()).optional(),
})

export type FacilityConfig = z.infer<typeof FacilitySchema>
export type PageConfig = z.infer<typeof PageSchema>
export type SectionConfig = z.infer<typeof SectionSchema>
export { ImageSchema, CTASchema, HoursSchema, UnitSchema, componentNames, layoutValues }
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd packages/facility-config && bun run test`
Expected: All 7 tests PASS

- [ ] **Step 5: Implement loader.ts**

`packages/facility-config/src/loader.ts`:
```ts
import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'
import { FacilitySchema, type FacilityConfig } from './schema'

const DATA_DIR = join(process.cwd(), '../../data/facilities')

export function loadFacility(slug: string): FacilityConfig {
  const filePath = join(DATA_DIR, `${slug}.json`)
  let raw: string
  try {
    raw = readFileSync(filePath, 'utf-8')
  } catch {
    throw new Error(`Facility config not found: ${filePath}`)
  }
  const parsed = JSON.parse(raw)
  const result = FacilitySchema.safeParse(parsed)
  if (!result.success) {
    throw new Error(`Invalid facility config "${slug}":\n${result.error.issues.map(i => `  - ${i.path.join('.')}: ${i.message}`).join('\n')}`)
  }
  return result.data
}

export function loadAllFacilities(): FacilityConfig[] {
  const files = readdirSync(DATA_DIR).filter(f => f.endsWith('.json'))
  return files.map(f => loadFacility(f.replace('.json', '')))
}

export function loadSubdirectoryFacilities(): FacilityConfig[] {
  return loadAllFacilities().filter(f => f.deployment.mode === 'subdirectory')
}
```

- [ ] **Step 6: Implement validate.ts**

`packages/facility-config/src/validate.ts`:
```ts
import { loadAllFacilities } from './loader'

try {
  const facilities = loadAllFacilities()
  console.log(`Validated ${facilities.length} facility config(s) successfully.`)
} catch (error) {
  console.error('Facility config validation failed:')
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
}
```

- [ ] **Step 7: Update barrel export**

`packages/facility-config/src/index.ts`:
```ts
export { FacilitySchema, type FacilityConfig, type PageConfig, type SectionConfig } from './schema'
export { ImageSchema, CTASchema, HoursSchema, UnitSchema, componentNames, layoutValues } from './schema'
export { loadFacility, loadAllFacilities, loadSubdirectoryFacilities } from './loader'
```

- [ ] **Step 8: Create smithtown.json seed data**

Copy the full JSON from the spec (lines 95-430 of the design spec) into `data/facilities/smithtown.json`.

- [ ] **Step 9: Run validate**

Run: `cd packages/facility-config && bun run validate`
Expected: "Validated 1 facility config(s) successfully."

- [ ] **Step 10: Commit**

```bash
git add packages/facility-config/ data/
git commit -m "feat: implement Zod facility config schema with validation"
```

---

## Phase 2: Design Tokens & Primitives

### Task 4: Scaffold storage-ui package with design tokens

**Files:**
- Create: `packages/storage-ui/package.json`
- Create: `packages/storage-ui/tsconfig.json`
- Create: `packages/storage-ui/src/tokens.css`
- Create: `packages/storage-ui/src/utils.ts`
- Create: `packages/storage-ui/src/index.ts`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "@jerry/storage-ui",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "type-check": "tsc --noEmit",
    "test": "vitest run"
  },
  "dependencies": {
    "class-variance-authority": "^0.7",
    "clsx": "^2",
    "tailwind-merge": "^3",
    "lucide-react": "^0.460",
    "react": "^19",
    "react-dom": "^19",
    "zod": "^3.23.0",
    "@jerry/facility-config": "workspace:*"
  },
  "devDependencies": {
    "@jerry/tsconfig": "workspace:*",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "typescript": "^5",
    "vitest": "^3",
    "@testing-library/react": "^16",
    "@testing-library/jest-dom": "^6",
    "jsdom": "^25"
  }
}
```

- [ ] **Step 2: Create tokens.css**

```css
@theme {
  /* Colors — overridden per-facility via inline style */
  --color-primary: oklch(0.55 0.15 250);
  --color-primary-foreground: oklch(0.98 0 0);
  --color-accent: oklch(0.7 0.18 30);
  --color-accent-foreground: oklch(0.98 0 0);
  --color-background: oklch(0.99 0 0);
  --color-foreground: oklch(0.15 0 0);
  --color-muted: oklch(0.95 0 0);
  --color-muted-foreground: oklch(0.45 0 0);
  --color-border: oklch(0.9 0 0);

  /* Typography — overridden per-template */
  --font-sans: 'Inter', ui-sans-serif, system-ui, sans-serif;

  /* Spacing scale */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 2rem;
  --spacing-xl: 4rem;
  --spacing-2xl: 6rem;

  /* Border radii — overridden per-template */
  --radius-sm: 0.25rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
}
```

- [ ] **Step 3: Create utils.ts**

```ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

- [ ] **Step 4: Create barrel export**

`packages/storage-ui/src/index.ts`:
```ts
export { cn } from './utils'
```

- [ ] **Step 5: Create tsconfig.json and install**

```json
{
  "extends": "@jerry/tsconfig/library.json",
  "include": ["src/**/*.ts", "src/**/*.tsx"],
  "exclude": ["node_modules", "dist"]
}
```

Run: `bun install`

- [ ] **Step 6: Commit**

```bash
git add packages/storage-ui/
git commit -m "feat: scaffold storage-ui package with design tokens"
```

---

### Task 5: Implement primitive components

**Files:**
- Create: `packages/storage-ui/src/primitives/heading.tsx`
- Create: `packages/storage-ui/src/primitives/text.tsx`
- Create: `packages/storage-ui/src/primitives/button.tsx`
- Create: `packages/storage-ui/src/primitives/image.tsx`
- Create: `packages/storage-ui/src/primitives/container.tsx`
- Create: `packages/storage-ui/src/primitives/stack.tsx`
- Create: `packages/storage-ui/src/primitives/cluster.tsx`
- Create: `packages/storage-ui/src/primitives/grid.tsx`
- Create: `packages/storage-ui/src/primitives/section.tsx`
- Create: `packages/storage-ui/src/primitives/index.ts`
- Create: `packages/storage-ui/src/primitives/__tests__/primitives.test.tsx`

This task creates all 9 primitive components. Each uses CVA for variant recipes and token-based Tailwind classes. No arbitrary values.

- [ ] **Step 1: Write primitive tests**

Test that `Heading` renders correct semantic element, `Button` applies variant classes, `Image` enforces alt prop, `Container` applies size classes, layout primitives (`Stack`, `Cluster`, `Grid`) render with gap classes.

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd packages/storage-ui && bun run test`

- [ ] **Step 3: Implement all 9 primitives**

Each component follows this pattern:
- Props typed with TypeScript interface
- CVA recipe for variants
- `cn()` for class merging
- Only token-based Tailwind classes (no arbitrary values)
- `forwardRef` where appropriate

Key implementation notes per the spec:
- `Heading`: `level` prop (1-6), renders corresponding `<h1>`-`<h6>` with type scale classes
- `Button`: CVA variants (primary/secondary/outline/ghost), sizes (sm/md/lg), renders `<a>` when `href` provided, `<button>` otherwise
- `Image`: Wraps Next.js `<img>` (not `next/image` since static export), enforces `alt` prop exists, supports `aspect` prop for aspect-ratio CSS
- `Section`: Accepts optional `background` (`{ src, alt }`) and `overlay` (dark/light). When background provided, renders `Image` primitive internally with absolute positioning + overlay div

- [ ] **Step 4: Run tests to verify they pass**

- [ ] **Step 5: Export from barrel**

Update `packages/storage-ui/src/index.ts` to re-export all primitives.

- [ ] **Step 6: Commit**

```bash
git add packages/storage-ui/src/primitives/
git commit -m "feat: implement 9 primitive components with CVA variants"
```

---

## Phase 3: Compositions

### Task 6: Implement composition components

**Files:**
- Create: `packages/storage-ui/src/compositions/section-header.tsx`
- Create: `packages/storage-ui/src/compositions/card.tsx`
- Create: `packages/storage-ui/src/compositions/media-block.tsx`
- Create: `packages/storage-ui/src/compositions/feature-item.tsx`
- Create: `packages/storage-ui/src/compositions/cta-group.tsx`
- Create: `packages/storage-ui/src/compositions/index.ts`
- Create: `packages/storage-ui/src/compositions/__tests__/compositions.test.tsx`

- [ ] **Step 1: Write composition tests**

Test that:
- `SectionHeader` renders `Heading` with correct level and optional description via `Text`
- `Card` compound component renders slots (`Card.Image`, `Card.Body`, `Card.Title`, `Card.Description`)
- `MediaBlock` renders children in correct order based on `layout` prop (image-right vs image-left vs stacked)
- `FeatureItem` renders icon + heading + text
- `CTAGroup` renders primary Button, and secondary Button when `secondary` prop provided. Data-driven: accepts `{ label, href, variant }` objects, NOT children.

- [ ] **Step 2: Run tests to verify they fail**

- [ ] **Step 3: Implement all 5 compositions**

Key implementation notes:
- `SectionHeader`: Props: `heading` (string), `description?` (string), `level?` (number, default 2). Uses `Heading` and `Text` primitives.
- `Card`: Compound component pattern with `Card.Image`, `Card.Body`, `Card.Title`, `Card.Description`, and `children` slot in body.
- `MediaBlock`: `layout` prop controls flex direction. `MediaBlock.Image` and `MediaBlock.Content` as compound slots.
- `CTAGroup`: Props: `primary: { label, href, variant }`, `secondary?: { label, href, variant }`. Renders `Button` primitives internally. Does NOT use children — data-driven for JSON compatibility.

- [ ] **Step 4: Run tests to verify they pass**

- [ ] **Step 5: Export from barrel and commit**

```bash
git add packages/storage-ui/src/compositions/
git commit -m "feat: implement 5 composition components"
```

---

## Phase 4: Templates, Provider, Renderer

### Task 7: Implement template presets and FacilityProvider

**Files:**
- Create: `packages/storage-ui/src/templates/types.ts`
- Create: `packages/storage-ui/src/templates/modern.ts`
- Create: `packages/storage-ui/src/templates/bold.ts`
- Create: `packages/storage-ui/src/templates/friendly.ts`
- Create: `packages/storage-ui/src/templates/index.ts`
- Create: `packages/storage-ui/src/templates/build-token-style.ts`
- Create: `packages/storage-ui/src/providers/facility-provider.tsx`
- Create: `packages/storage-ui/src/hooks/use-analytics.ts`
- Create: `packages/storage-ui/src/hooks/use-facility.ts`

- [ ] **Step 1: Implement template types and presets**

`packages/storage-ui/src/templates/types.ts`:
```ts
export interface Template {
  name: string
  tokens: Record<string, string>
  defaults: Record<string, { variant?: string; layout?: string }>
}
```

Then implement `modern.ts`, `bold.ts`, `friendly.ts` matching spec lines 905-963. Each exports a `Template` object.

`packages/storage-ui/src/templates/build-token-style.ts`:
```ts
import type { Template } from './types'
import type { FacilityConfig } from '@jerry/facility-config'

export function buildTokenStyle(
  template: Template,
  branding: FacilityConfig['branding']
): React.CSSProperties {
  const style: Record<string, string> = {}

  for (const [key, value] of Object.entries(template.tokens)) {
    style[key] = value
  }

  if (branding.colors.primary) style['--color-primary'] = branding.colors.primary
  if (branding.colors.accent) style['--color-accent'] = branding.colors.accent

  return style as React.CSSProperties
}
```

- [ ] **Step 2: Implement FacilityProvider and hooks**

`packages/storage-ui/src/providers/facility-provider.tsx`:
```tsx
'use client'
import { createContext, type ReactNode } from 'react'
import type { FacilityConfig } from '@jerry/facility-config'

export const FacilityContext = createContext<FacilityConfig | null>(null)

export function FacilityProvider({
  facility,
  children,
}: {
  facility: FacilityConfig
  children: ReactNode
}) {
  return (
    <FacilityContext.Provider value={facility}>
      {children}
    </FacilityContext.Provider>
  )
}
```

`packages/storage-ui/src/hooks/use-facility.ts`:
```ts
'use client'
import { useContext } from 'react'
import { FacilityContext } from '../providers/facility-provider'

export function useFacility() {
  const facility = useContext(FacilityContext)
  if (!facility) throw new Error('useFacility must be used within FacilityProvider')
  return facility
}
```

`packages/storage-ui/src/hooks/use-analytics.ts`:
```ts
'use client'
import { useContext, useCallback } from 'react'
import { FacilityContext } from '../providers/facility-provider'

declare global {
  interface Window { gtag?: (...args: unknown[]) => void }
}

export function useAnalytics() {
  const facility = useContext(FacilityContext)
  const track = useCallback((event: string) => {
    const events = facility?.analytics?.gtagEvents as Record<string, boolean> | undefined
    if (facility?.analytics?.gtag && events?.[event]) {
      window.gtag?.('event', event)
    }
  }, [facility])
  return { track }
}
```

- [ ] **Step 3: Export and commit**

```bash
git add packages/storage-ui/src/templates/ packages/storage-ui/src/providers/ packages/storage-ui/src/hooks/
git commit -m "feat: implement templates, FacilityProvider, and analytics hook"
```

---

### Task 8: Implement PageRenderer and component registry

**Files:**
- Create: `packages/storage-ui/src/renderer/registry.ts`
- Create: `packages/storage-ui/src/renderer/page-renderer.tsx`
- Create: `packages/storage-ui/src/renderer/index.ts`
- Create: `packages/storage-ui/src/renderer/__tests__/page-renderer.test.tsx`

- [ ] **Step 1: Write PageRenderer tests**

Test:
- Renders sections in layout order
- Applies template defaults when section has no variant/layout
- Section-level variant overrides template default
- Throws descriptive error for unknown component

- [ ] **Step 2: Run tests to verify they fail**

- [ ] **Step 3: Implement registry and PageRenderer**

Registry maps component names to React components (initially stubs that render a div with the section key — real sections added in Phase 5).

PageRenderer walks `page.layout`, looks up each section in `page.sections`, resolves the component from registry, applies variant/layout resolution (section JSON → template defaults → component defaults), includes null guard with descriptive error.

- [ ] **Step 4: Run tests to verify they pass**

- [ ] **Step 5: Commit**

```bash
git add packages/storage-ui/src/renderer/
git commit -m "feat: implement PageRenderer with component registry"
```

---

## Phase 5: Section Components

### Task 9: Implement Hero and HeroSimple sections

**Files:**
- Create: `packages/storage-ui/src/sections/hero.tsx`
- Create: `packages/storage-ui/src/sections/hero-simple.tsx`
- Create: `packages/storage-ui/src/sections/__tests__/hero.test.tsx`

- [ ] **Step 1: Write Hero tests** — renders heading (h1), subtitle, background image, CTA button. Variant "overlay" adds dark overlay. Variant "split" splits image and content side-by-side.

- [ ] **Step 2: Implement Hero** — uses `Section` (with background), `Container`, `Stack`, `Heading` (level 1), `Text`, `CTAGroup`. Zero hardcoded text. Exports `HeroContentSchema`.

- [ ] **Step 3: Write HeroSimple tests** — renders heading (h2), optional blurb, optional breadcrumb.

- [ ] **Step 4: Implement HeroSimple** — uses `Section`, `Container`, `SectionHeader`. Exports `HeroSimpleContentSchema`.

- [ ] **Step 5: Register in registry, run all tests, commit**

```bash
git commit -m "feat: implement Hero and HeroSimple sections"
```

---

### Task 10: Implement ContentSection and CallToAction sections

**Files:**
- Create: `packages/storage-ui/src/sections/content-section.tsx`
- Create: `packages/storage-ui/src/sections/call-to-action.tsx`
- Create: `packages/storage-ui/src/sections/__tests__/content-cta.test.tsx`

- [ ] **Step 1: Write ContentSection tests** — renders heading, blurb, paragraphs, optional image. Layout "image-right" puts image on right via `MediaBlock`.

- [ ] **Step 2: Implement ContentSection** — uses `Section`, `Container`, `MediaBlock` (when image present), `SectionHeader`, `Text` for paragraphs. Falls back to stacked layout without `MediaBlock` when no image. Exports `ContentSectionContentSchema`.

- [ ] **Step 3: Write CallToAction tests** — renders heading, blurb, primary CTA, optional secondary CTA, optional background image.

- [ ] **Step 4: Implement CallToAction** — uses `Section` (with optional background/overlay), `Container`, `SectionHeader`, `CTAGroup`. Exports `CallToActionContentSchema`.

- [ ] **Step 5: Register, test, commit**

```bash
git commit -m "feat: implement ContentSection and CallToAction sections"
```

---

### Task 11: Implement UnitGrid and SizeGuide sections

**Files:**
- Create: `packages/storage-ui/src/sections/unit-grid.tsx`
- Create: `packages/storage-ui/src/sections/size-guide.tsx`
- Create: `packages/storage-ui/src/sections/__tests__/units.test.tsx`

- [ ] **Step 1: Write UnitGrid tests** — reads from `facilityData.data.units`. Filters by ID when `content.filter` provided. Falls back to all units when filter misses. Variant "cards" renders `Card` components. Variant "table" renders HTML table.

- [ ] **Step 2: Implement UnitGrid** — uses `Section`, `Container`, `SectionHeader`, `Grid`, `Card` (cards variant) or `<table>` with token classes (table variant). Reads `facilityData.data.units`, applies filter, shows pricing/features based on content flags. Exports `UnitGridContentSchema`.

- [ ] **Step 3: Write SizeGuide tests** — renders guides array with size, description, fits list.

- [ ] **Step 4: Implement SizeGuide** — uses `Section`, `Container`, `SectionHeader`, `Grid`, `Card`. Exports `SizeGuideContentSchema`.

- [ ] **Step 5: Register, test, commit**

```bash
git commit -m "feat: implement UnitGrid and SizeGuide sections"
```

---

### Task 12: Implement FeatureGrid and TestimonialGrid sections

**Files:**
- Create: `packages/storage-ui/src/sections/feature-grid.tsx`
- Create: `packages/storage-ui/src/sections/testimonial-grid.tsx`
- Create: `packages/storage-ui/src/sections/__tests__/grids.test.tsx`

- [ ] **Step 1: Write FeatureGrid tests** — renders features from content (inline features array) or from `facilityData.data.amenities`. Uses `FeatureItem` composition.

- [ ] **Step 2: Implement FeatureGrid** — uses `Section`, `Container`, `SectionHeader`, `Grid`, `FeatureItem`. Variant "icons" shows icon+text. Variant "cards" wraps in `Card`. Variant "pills" uses rounded pill styling. Exports `FeatureGridContentSchema`.

- [ ] **Step 3: Write TestimonialGrid tests** — reads from `facilityData.data.testimonials`, renders name, rating, text.

- [ ] **Step 4: Implement TestimonialGrid** — uses `Section`, `Container`, `SectionHeader`, `Grid`, `Card`. Exports `TestimonialGridContentSchema`.

- [ ] **Step 5: Register, test, commit**

```bash
git commit -m "feat: implement FeatureGrid and TestimonialGrid sections"
```

---

### Task 13: Implement ContactForm, MapSection, FacilityDirectory

**Files:**
- Create: `packages/storage-ui/src/sections/contact-form.tsx`
- Create: `packages/storage-ui/src/sections/map-section.tsx`
- Create: `packages/storage-ui/src/sections/facility-directory.tsx`
- Create: `packages/storage-ui/src/sections/__tests__/interactive.test.tsx`

- [ ] **Step 1: Write ContactForm tests** — renders fields from `content.fields` array, submit button with `content.submitLabel`, success message on submit.

- [ ] **Step 2: Implement ContactForm** — client component (`'use client'`). Uses `Section`, `Container`, `SectionHeader`, form elements with token-based Tailwind classes. Client-side state for form submission (no backend — static export). Fires `reserve_click` analytics event on submit. Exports `ContactFormContentSchema`.

- [ ] **Step 3: Write MapSection tests** — renders heading, address blurb, directions list.

- [ ] **Step 4: Implement MapSection** — uses `Section`, `Container`, `SectionHeader`. Variant "embedded" renders an iframe placeholder for Google Maps (actual embed URL from coordinates). Variant "static" renders address + directions text only. Exports `MapSectionContentSchema`.

- [ ] **Step 5: Implement FacilityDirectory** — renders list of facilities with name, address, link. Used only in umbrella app. Receives facilities array via props (not context). Exports `FacilityDirectoryContentSchema`.

- [ ] **Step 6: Create sections barrel export and register all in registry**

`packages/storage-ui/src/sections/index.ts` — export all 11 sections.
Update `registry.ts` to import all real section components.

- [ ] **Step 7: Run full test suite, commit**

```bash
git commit -m "feat: implement ContactForm, MapSection, FacilityDirectory sections"
```

---

## Phase 6: Next.js Apps

### Task 14: Scaffold and implement the umbrella app (elevation-group)

**Files:**
- Create: `apps/elevation-group/package.json`
- Create: `apps/elevation-group/next.config.ts`
- Create: `apps/elevation-group/tsconfig.json`
- Create: `apps/elevation-group/postcss.config.mjs`
- Create: `apps/elevation-group/src/styles/globals.css`
- Create: `apps/elevation-group/src/app/layout.tsx`
- Create: `apps/elevation-group/src/app/page.tsx`
- Create: `apps/elevation-group/src/app/[facility]/layout.tsx`
- Create: `apps/elevation-group/src/app/[facility]/[[...page]]/page.tsx`
- Create: `apps/elevation-group/src/lib/metadata.ts`
- Create: `apps/elevation-group/src/components/nav.tsx`
- Create: `apps/elevation-group/src/components/footer.tsx`
- Create: `apps/elevation-group/src/components/gtag.tsx`
- Create: `apps/elevation-group/netlify.toml`

- [ ] **Step 1: Create package.json with dependencies**

Dependencies: `@jerry/storage-ui`, `@jerry/facility-config`, `next`, `react`, `react-dom`.
DevDependencies: `@jerry/tsconfig`, `@tailwindcss/postcss`, `tailwindcss`, `typescript`.

- [ ] **Step 2: Create next.config.ts**

```ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'export',
  transpilePackages: ['@jerry/storage-ui', '@jerry/facility-config'],
}

export default nextConfig
```

- [ ] **Step 3: Create globals.css with @source directives**

```css
@import "tailwindcss";
@source "../../../../packages/storage-ui/src";
@import "@jerry/storage-ui/tokens.css";
```

- [ ] **Step 4: Create root layout.tsx**

Root layout: HTML shell, fonts, globals.css import. No facility-specific tokens here (those go in the `[facility]` segment layout).

- [ ] **Step 5: Create root page.tsx (landing + facility directory)**

Reads all subdirectory facilities via `loadSubdirectoryFacilities()`. Renders landing content with `FacilityDirectory` section listing all facilities.

- [ ] **Step 6: Create [facility]/layout.tsx (segment layout)**

Loads facility config by slug param. Wraps children in `FacilityProvider`. Applies `buildTokenStyle()` on wrapping `<div>`. Injects per-facility gtag via `GtagScript` client component. Renders `Nav` and `Footer` with `branding.showParent` toggle.

- [ ] **Step 7: Create [facility]/[[...page]]/page.tsx**

```tsx
import { loadFacility, loadSubdirectoryFacilities } from '@jerry/facility-config'
import { PageRenderer } from '@jerry/storage-ui'
import { templates } from '@jerry/storage-ui/templates'

export const dynamicParams = false

export function generateStaticParams() {
  const facilities = loadSubdirectoryFacilities()
  return facilities.flatMap(f =>
    Object.entries(f.pages)
      .filter(([, page]) => page.enabled)
      .map(([pageSlug]) => ({
        facility: f.slug,
        page: pageSlug === 'home' ? [] : [pageSlug],
      }))
  )
}

export function generateMetadata({ params }) {
  // Resolve SEO from facility + page config
}

export default function FacilityPage({ params }) {
  const facility = loadFacility(params.facility)
  const pageSlug = params.page?.[0] ?? 'home'
  const page = facility.pages[pageSlug]
  const template = templates[facility.branding.template]
  return <PageRenderer page={page} facilityData={facility} template={template} />
}
```

- [ ] **Step 8: Create metadata.ts helper**

Generates `<title>`, `<meta>`, OG tags, canonical URL (computed from deployment mode), and JSON-LD structured data from facility config. SEO field resolution: page replaces facility defaults per-field.

- [ ] **Step 9: Create Nav, Footer, GtagScript components**

- `Nav`: renders facility name, logo, links to enabled pages. `showParent` controls "An Elevation Group Property" badge.
- `Footer`: facility address, phone, hours. `showParent` controls parent branding.
- `GtagScript`: client component, loads gtag script when `analytics.gtag` is set.

- [ ] **Step 10: Create netlify.toml**

```toml
[build]
  command = "cd ../.. && bun install && turbo build --filter=@jerry/elevation-group"
  publish = "out"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

- [ ] **Step 11: Build and verify**

Run: `cd apps/elevation-group && bun run build`
Expected: Static HTML files generated in `out/` for all facilities and their enabled pages.

- [ ] **Step 12: Commit**

```bash
git add apps/elevation-group/
git commit -m "feat: implement umbrella app with facility routing and SEO"
```

---

### Task 15: Scaffold and implement the standalone app (facility-standalone)

**Files:**
- Create: `apps/facility-standalone/package.json`
- Create: `apps/facility-standalone/next.config.ts`
- Create: `apps/facility-standalone/tsconfig.json`
- Create: `apps/facility-standalone/postcss.config.mjs`
- Create: `apps/facility-standalone/src/styles/globals.css`
- Create: `apps/facility-standalone/src/app/layout.tsx`
- Create: `apps/facility-standalone/src/app/[[...page]]/page.tsx`
- Create: `apps/facility-standalone/src/lib/metadata.ts`
- Create: `apps/facility-standalone/src/components/nav.tsx`
- Create: `apps/facility-standalone/src/components/footer.tsx`
- Create: `apps/facility-standalone/src/components/gtag.tsx`
- Create: `apps/facility-standalone/netlify.toml`

- [ ] **Step 1: Create package.json** (same deps as umbrella)

- [ ] **Step 2: Create next.config.ts** (same as umbrella — `output: 'export'`)

- [ ] **Step 3: Create globals.css** (same as umbrella)

- [ ] **Step 4: Create root layout.tsx**

Loads facility via `FACILITY_SLUG` env var. Wraps in `FacilityProvider`. Applies `buildTokenStyle()` on `<html>` element (here it IS the root layout since there's only one facility). Renders Nav, Footer, GtagScript.

```tsx
const slug = process.env.FACILITY_SLUG
if (!slug) throw new Error('FACILITY_SLUG environment variable is required')
const facility = loadFacility(slug)
const template = templates[facility.branding.template]
```

- [ ] **Step 5: Create [[...page]]/page.tsx**

```tsx
export const dynamicParams = false

export function generateStaticParams() {
  const slug = process.env.FACILITY_SLUG!
  const facility = loadFacility(slug)
  return Object.entries(facility.pages)
    .filter(([, page]) => page.enabled)
    .map(([pageSlug]) => ({
      page: pageSlug === 'home' ? [] : [pageSlug],
    }))
}
```

- [ ] **Step 6: Create metadata.ts** — same logic as umbrella but canonical uses `deployment.domain` instead of `elevationgroup.com/[slug]`.

- [ ] **Step 7: Create Nav, Footer, GtagScript** — reuse patterns from umbrella. Can share via imports from `@jerry/storage-ui` if identical, or duplicate if minor differences.

- [ ] **Step 8: Create netlify.toml**

```toml
[build]
  command = "cd ../.. && bun install && turbo build --filter=@jerry/facility-standalone"
  publish = "out"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

- [ ] **Step 9: Test build with FACILITY_SLUG**

Run: `FACILITY_SLUG=smithtown bun run build --filter=@jerry/facility-standalone`
Expected: Static HTML in `out/` for smithtown's enabled pages only.

- [ ] **Step 10: Commit**

```bash
git add apps/facility-standalone/
git commit -m "feat: implement standalone facility app with env-based config"
```

---

## Phase 7: Seed Data & Visual Polish

### Task 16: Add seed facility data and sample images

**Files:**
- Create: `data/facilities/riverside.json`
- Create: `apps/elevation-group/public/images/smithtown/` (hero.jpg, interior.jpg, cta-bg.jpg, logo.png, og-default.jpg)
- Create: `apps/elevation-group/public/images/riverside/` (same set)

- [ ] **Step 1: Create riverside.json** — second facility using "bold" template with `deployment.mode: "standalone"` and `domain: "riversidestorage.com"`. Different colors, content, unit sizes. Include all 6 pages (home, units, amenities, reserve, directions, reviews enabled).

- [ ] **Step 2: Download seed stock photos from Unsplash**

Use `curl` to download free storage facility images. Save to `public/images/smithtown/` and `public/images/riverside/`. Resize to recommended dimensions from spec (hero: 1920x1080, CTA: 1920x640, inline: 800x600, OG: 1200x630).

- [ ] **Step 3: Build both apps and visually verify**

Run: `bun run build`
Run: `cd apps/elevation-group && bunx serve out` — open in browser, check all routes.

- [ ] **Step 4: Commit**

```bash
git add data/facilities/riverside.json apps/elevation-group/public/ apps/facility-standalone/public/
git commit -m "feat: add riverside facility and seed stock photos"
```

---

## Phase 8: E2E Testing

### Task 17: Add Playwright E2E smoke tests

**Files:**
- Create: `apps/elevation-group/playwright.config.ts`
- Create: `apps/elevation-group/e2e/smoke.spec.ts`

- [ ] **Step 1: Create Playwright config**

```ts
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  webServer: {
    command: 'bunx serve out -p 3456',
    port: 3456,
    reuseExistingServer: true,
  },
})
```

- [ ] **Step 2: Write smoke tests**

```ts
import { test, expect } from '@playwright/test'

test('umbrella landing page renders facility directory', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('h1')).toBeVisible()
})

test('facility homepage renders hero heading', async ({ page }) => {
  await page.goto('/smithtown')
  await expect(page.locator('h1')).toContainText('Secure Storage in Smithtown')
})

test('facility subpage renders correct heading', async ({ page }) => {
  await page.goto('/smithtown/units')
  await expect(page.locator('h2').first()).toContainText('Unit Sizes')
})

test('disabled page returns 404', async ({ page }) => {
  const response = await page.goto('/smithtown/reviews')
  expect(response?.status()).toBe(404)
})

test('navigation excludes disabled pages', async ({ page }) => {
  await page.goto('/smithtown')
  const nav = page.locator('nav')
  await expect(nav.getByText('Reviews')).not.toBeVisible()
})
```

- [ ] **Step 3: Build app and run E2E tests**

Run: `cd apps/elevation-group && bun run build && bunx playwright test`
Expected: All smoke tests pass.

- [ ] **Step 4: Commit**

```bash
git add apps/elevation-group/playwright.config.ts apps/elevation-group/e2e/
git commit -m "test: add Playwright E2E smoke tests for umbrella app"
```

---

## Phase 9: Final Verification

### Task 18: Full build, test, and cleanup

- [ ] **Step 1: Run full monorepo build**

Run: `bun run build`
Expected: Both apps build successfully.

- [ ] **Step 2: Run all unit tests**

Run: `bun run test` (at root — Turbo runs all package tests)
Expected: All tests pass.

- [ ] **Step 3: Run validation**

Run: `bun run validate`
Expected: All facility configs valid.

- [ ] **Step 4: Run E2E**

Run: `cd apps/elevation-group && bunx playwright test`
Expected: All smoke tests pass.

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "chore: final cleanup and verification"
```

---

## Task Dependency Graph

```
Task 1 (monorepo scaffold)
  └─ Task 2 (facility-config scaffold)
       └─ Task 3 (Zod schemas)
            └─ Task 4 (storage-ui scaffold + tokens)
                 └─ Task 5 (primitives)
                      └─ Task 6 (compositions)
                           └─ Task 7 (templates + provider)
                                └─ Task 8 (PageRenderer)
                                     ├─ Task 9 (Hero, HeroSimple)
                                     ├─ Task 10 (ContentSection, CTA)
                                     ├─ Task 11 (UnitGrid, SizeGuide)
                                     ├─ Task 12 (FeatureGrid, TestimonialGrid)
                                     └─ Task 13 (ContactForm, MapSection, Directory)
                                          ├─ Task 14 (umbrella app)
                                          └─ Task 15 (standalone app)
                                               └─ Task 16 (seed data)
                                                    └─ Task 17 (E2E tests)
                                                         └─ Task 18 (final verification)
```

Tasks 9-13 can be parallelized (independent section implementations).
Tasks 14-15 can be parallelized (independent app implementations).
