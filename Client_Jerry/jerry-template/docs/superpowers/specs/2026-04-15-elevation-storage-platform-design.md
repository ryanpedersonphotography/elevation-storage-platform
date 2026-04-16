# Elevation Group Storage Facility Platform — Design Spec

## Overview

A modular Next.js platform for Elevation Group, a company that owns multiple self-storage facility properties. The platform renders facility websites from JSON configuration files, using shared components built on shadcn/ui + Tailwind CSS v4. Facilities can be served as subdirectories under `elevationgroup.com` or as standalone sites on custom domains, all deployed to Netlify as static exports.

## Architecture

### Monorepo Structure (Turborepo + Bun)

```
jerry-template/
├── apps/
│   ├── elevation-group/          # Umbrella site (elevationgroup.com)
│   └── facility-standalone/      # Template for custom-domain deploys
├── packages/
│   ├── storage-ui/               # Shared components (primitives → compositions → sections)
│   ├── facility-config/          # Config types, Zod schemas, loader utilities
│   └── tsconfig/                 # Shared TypeScript configs
├── data/
│   └── facilities/               # Per-facility JSON config files
│       ├── smithtown.json
│       ├── riverside.json
│       └── ...
├── turbo.json
├── package.json
└── netlify.toml
```

### Tech Stack

| Tool | Version | Purpose |
|------|---------|---------|
| Turborepo | ^2 | Monorepo task orchestration |
| Bun | latest | Package manager + workspace manager |
| Next.js | ^15 | App Router, static export |
| React | ^19 | UI library |
| Tailwind CSS | v4 | CSS-first styling (no JS config) |
| shadcn/ui | latest | Component primitives |
| CVA | ^0.7 | Variant recipes |
| Zod | latest | JSON config validation at build time |
| Lucide React | latest | Icon library |

### Two App Targets

**`apps/elevation-group`** — Umbrella site

- Domain: `elevationgroup.com`
- Routes: `/` (landing + facility directory), `/[facility]/[...page]` (dynamic per-facility pages)
- Reads all facility JSONs where `deployment.mode = "subdirectory"`
- Single Netlify site deployment

**`apps/facility-standalone`** — Standalone facility template

- Domain: per-facility custom domain (e.g., `smithtownstorage.com`)
- Routes: `/` (facility homepage), `/[...page]` (facility pages)
- Reads single facility JSON via `FACILITY_SLUG` environment variable
- Each standalone facility = separate Netlify site pointing to same repo, different env var

Both apps use the same `PageRenderer` and component library from `packages/storage-ui`. The only difference is how they resolve which facility config to load.

### Static Export

Both apps use `output: "export"` in `next.config.ts` with `generateStaticParams` to pre-render all pages at build time. Pure static HTML/CSS/JS served from Netlify's CDN — no server runtime needed.

## Facility JSON Configuration

Each facility is defined by a single JSON file in `data/facilities/[slug].json`. This file is the single source of truth for all content, pages, layouts, SEO, analytics, and branding.

### Full Schema

```json
{
  "slug": "smithtown",
  "name": "Smithtown Self Storage",

  "info": {
    "address": { "street": "123 Main St", "city": "Smithtown", "state": "NY", "zip": "11787" },
    "phone": "(631) 555-1234",
    "email": "smithtown@elevationgroup.com",
    "coordinates": { "lat": 40.855, "lng": -73.200 },
    "hours": { "mon-fri": "6am-9pm", "sat-sun": "8am-6pm" }
  },

  "branding": {
    "showParent": true,
    "template": "modern",
    "colors": {
      "primary": "oklch(0.55 0.15 250)",
      "accent": "oklch(0.7 0.18 30)"
    },
    "logo": "/images/smithtown/logo.png"
  },

  "deployment": {
    "mode": "subdirectory",
    "domain": null
  },

  "seo": {
    "siteName": "Smithtown Self Storage",
    "defaultTitle": "Smithtown Self Storage | Secure Units in Smithtown, NY",
    "defaultDescription": "Affordable self storage in Smithtown, NY. Climate-controlled units, 24-hour access.",
    "keywords": ["self storage smithtown", "storage units smithtown ny", "climate controlled storage"],
    "ogImage": "/images/smithtown/og-default.jpg",
    "canonical": "https://elevationgroup.com/smithtown",
    "structuredData": {
      "type": "SelfStorage",
      "priceRange": "$49-$259/mo"
    }
  },

  "analytics": {
    "gtag": "G-XXXXXXXXXX",
    "gtagEvents": {
      "reserve_click": true,
      "phone_click": true,
      "directions_click": true
    }
  },

  "pages": {
    "home": {
      "enabled": true,
      "seo": {
        "title": "Smithtown Self Storage | Units from $49/mo",
        "description": "Secure, affordable storage units in Smithtown.",
        "keywords": ["storage near me", "cheap storage smithtown"],
        "ogImage": "/images/smithtown/og-home.jpg"
      },
      "layout": ["hero", "intro", "featured-units", "why-us", "cta"],
      "sections": {
        "hero": {
          "component": "Hero",
          "content": {
            "h1": "Secure Storage in Smithtown",
            "subtitle": "Climate-controlled units starting at $49/mo",
            "image": { "src": "/images/smithtown/hero.jpg", "alt": "Smithtown facility exterior" },
            "cta": { "label": "Reserve Now", "href": "/smithtown/reserve", "variant": "primary" }
          }
        },
        "intro": {
          "component": "ContentSection",
          "layout": "image-right",
          "content": {
            "h2": "Welcome to Smithtown Self Storage",
            "blurb": "Conveniently located off Route 25, our facility offers a range of unit sizes.",
            "paragraphs": [
              "We've been serving the Smithtown community since 2015.",
              "Whether you need short-term storage during a move or long-term space for your business inventory."
            ],
            "image": { "src": "/images/smithtown/interior.jpg", "alt": "Clean interior hallway" }
          }
        },
        "featured-units": {
          "component": "UnitGrid",
          "variant": "cards",
          "layout": "3-col",
          "content": {
            "h2": "Popular Unit Sizes",
            "blurb": "Find the perfect fit for your needs",
            "showPricing": true,
            "filter": ["5x5", "10x10", "10x20"]
          }
        },
        "why-us": {
          "component": "FeatureGrid",
          "layout": "4-col",
          "content": {
            "h2": "Why Choose Us",
            "blurb": "Everything you need for worry-free storage",
            "features": [
              { "icon": "clock", "h3": "24-Hour Access", "blurb": "Access your unit any time" },
              { "icon": "camera", "h3": "HD Security", "blurb": "24/7 video surveillance" },
              { "icon": "thermometer", "h3": "Climate Controlled", "blurb": "Temp & humidity regulated" },
              { "icon": "shield", "h3": "Gated Entry", "blurb": "Personal access code for every tenant" }
            ]
          }
        },
        "cta": {
          "component": "CallToAction",
          "layout": "centered",
          "content": {
            "h2": "Ready to reserve your unit?",
            "blurb": "Call us or reserve online today.",
            "image": { "src": "/images/smithtown/cta-bg.jpg", "alt": "" },
            "cta": { "label": "Get Started", "href": "/smithtown/reserve", "variant": "primary" },
            "ctaSecondary": { "label": "Call (631) 555-1234", "href": "tel:6315551234", "variant": "outline" }
          }
        }
      }
    },
    "units": {
      "enabled": true,
      "seo": {
        "title": "Unit Sizes & Pricing | Smithtown Self Storage",
        "description": "Compare storage unit sizes from 5x5 to 10x30.",
        "keywords": ["5x5 storage unit", "10x10 storage unit price"]
      },
      "layout": ["hero-simple", "unit-table", "size-guide", "cta"],
      "sections": { "..." }
    },
    "amenities": { "enabled": true, "seo": {}, "layout": [], "sections": {} },
    "reserve": { "enabled": true, "seo": {}, "layout": [], "sections": {} },
    "directions": { "enabled": true, "seo": {}, "layout": [], "sections": {} },
    "reviews": { "enabled": false }
  },

  "data": {
    "units": [
      { "size": "5x5", "sqft": 25, "price": 49, "features": ["indoor"] },
      { "size": "10x10", "sqft": 100, "price": 99, "features": ["indoor", "climate-controlled"] },
      { "size": "10x20", "sqft": 200, "price": 159, "features": ["drive-up"] }
    ],
    "amenities": [
      { "id": "24hr-access", "label": "24-Hour Access", "icon": "clock", "description": "Access your unit any time, day or night" },
      { "id": "security-cameras", "label": "Security Cameras", "icon": "camera", "description": "24/7 video surveillance" },
      { "id": "climate-control", "label": "Climate Controlled", "icon": "thermometer", "description": "Temperature and humidity regulated" }
    ],
    "testimonials": [
      { "name": "John D.", "rating": 5, "text": "Great facility, very clean and secure." }
    ]
  },

  "integrations": {}
}
```

### SEO Resolution

Page-level `seo` fields override facility-level `seo` defaults. Missing fields fall back to the facility defaults. The renderer automatically generates:

- `<title>` and `<meta name="description">`
- `<meta name="keywords">`
- Open Graph tags (`og:title`, `og:description`, `og:image`, `og:type`)
- Canonical URL
- JSON-LD structured data (LocalBusiness/SelfStorage schema)

### Analytics

- `gtag` ID injected via Next.js `<Script>` in the layout, per-facility
- `gtagEvents` flags control which custom events fire from shared components (Button, CTAGroup, etc.)
- If `gtag` is omitted or null, no analytics script loads
- The umbrella site can have its own top-level gtag for aggregate tracking, separate from per-facility tags

### Zod Validation

All facility JSON files are validated against a Zod schema at build time. Invalid component names, missing required content fields, unknown layout values, or malformed SEO data result in a build error, not a runtime surprise.

## Component Architecture

Four-layer hierarchy. Each layer builds on the one below it. No layer skips levels.

### Layer 1: Primitives (Design Tokens + Base Elements)

Located in `packages/storage-ui/src/primitives/`. Built on shadcn/ui.

**Design Tokens** (`tokens.css`):
- OKLCH color space for perceptual uniformity across facility palettes
- Spacing scale: xs (0.25rem) → 2xl (6rem)
- Type scale: sm (0.875rem) → 3xl (3rem)
- Border radii: sm → lg (varies by template)
- Font families (varies by template)

**Primitive Components:**

| Component | Purpose | Props |
|-----------|---------|-------|
| `Heading` | Semantic headings, maps level to type scale | `level` (1-6), `children` |
| `Text` | Body copy | `size` (sm/base/lg/xl), `children` |
| `Button` | Actions, CVA variant recipes | `variant` (primary/secondary/outline/ghost), `size` (sm/md/lg), `href?`, `children` |
| `Image` | Enforces alt text, lazy loading, aspect ratios | `src`, `alt`, `aspect?`, `priority?` |
| `Container` | Max-width wrapper with padding from tokens | `size` (sm/md/lg/xl), `children` |
| `Stack` | Vertical layout | `gap`, `align?`, `children` |
| `Cluster` | Horizontal layout | `gap`, `align?`, `justify?`, `children` |
| `Grid` | Responsive grid with column recipes | `cols`, `gap`, `children` |
| `Section` | Page section with vertical spacing, optional background | `background?`, `overlay?`, `children` |

### Layer 2: Compositions (Reusable Patterns)

Located in `packages/storage-ui/src/compositions/`. Compose primitives into reusable UI patterns. Uses children and slots for flexibility.

| Composition | Purpose | Slot Pattern |
|-------------|---------|-------------|
| `SectionHeader` | h2 + optional blurb, used by every section | Props: `h2`, `blurb?` |
| `Card` | Generic card | `Card.Image`, `Card.Body`, `Card.Title`, `Card.Description`, `children` for footer slot |
| `MediaBlock` | Image + content, layout-aware | `MediaBlock.Image`, `MediaBlock.Content` (children slot). `layout`: image-right, image-left, stacked |
| `FeatureItem` | Icon + heading + text | Props: `icon`. Children for heading + text |
| `CTAGroup` | One or two buttons, consistent spacing | Children: Button elements |

### Layer 3: Sections (JSON-Driven, Pre-Designed)

Located in `packages/storage-ui/src/sections/`. Each section is a pre-designed component that receives `content`, `layout`, and `variant` from the facility JSON. Sections compose primitives and compositions — zero custom CSS, zero hardcoded text.

| Section | Purpose | Variants |
|---------|---------|----------|
| `Hero` | Full-width hero with background image | overlay, split, wave |
| `HeroSimple` | Compact page header with breadcrumb | minimal, colored |
| `ContentSection` | Text + image flexible layout | clean, bordered, soft |
| `UnitGrid` | Storage unit sizes & pricing | cards, table, compact |
| `FeatureGrid` | Amenities/features grid | icons, cards, pills |
| `CallToAction` | CTA banner with buttons | gradient, solid, rounded |
| `ContactForm` | Reserve/contact form | standard, minimal |
| `MapSection` | Embedded map + directions | embedded, static |
| `TestimonialGrid` | Reviews/testimonials | cards, quotes |
| `SizeGuide` | Visual unit size comparison | visual, table |
| `FacilityDirectory` | Facility locator (umbrella only) | cards, list, map |

### Layer 4: PageRenderer (The Engine)

Located in `packages/storage-ui/src/renderer/PageRenderer.tsx`.

```tsx
const registry = { Hero, HeroSimple, ContentSection, UnitGrid, ... }

function PageRenderer({ page, facilityData, template }) {
  return (
    <>
      {page.layout.map(sectionKey => {
        const section = page.sections[sectionKey]
        const Component = registry[section.component]
        const defaults = template.defaults[section.component]
        return (
          <Component
            key={sectionKey}
            content={section.content}
            layout={section.layout ?? defaults?.layout}
            variant={section.variant ?? defaults?.variant}
            facilityData={facilityData}
          />
        )
      })}
    </>
  )
}
```

**Variant/layout resolution order (most specific wins):**
1. Section JSON (`section.variant` / `section.layout`)
2. Template defaults (`template.defaults[Component]`)
3. Component default props

## DRY Enforcement Rules

These are mandatory architectural constraints, not suggestions:

1. **Primitives own all styling.** Sections never use raw HTML tags. `<h2>` → always `<Heading level={2}>`. `<p>` → always `<Text>`. `<img>` → always `<Image>`.
2. **Compositions prevent pattern duplication.** h2+blurb → `SectionHeader`. Icon+title+text → `FeatureItem`. Image+content side-by-side → `MediaBlock`. No section reimplements these patterns.
3. **Children + slots for flexibility.** `Card.Body` accepts children for custom content. `MediaBlock.Content` is a slot. `Section` wraps any children. Compositions are flexible without being unpredictable.
4. **Tokens constrain all visual decisions.** Spacing only uses token values (`gap="lg"`, not `gap="37px"`). Colors only from brand palette. Font sizes from type scale. No magic numbers, no one-off values.
5. **Variant recipes via CVA, not conditional CSS.** CVA recipes define variant → className maps. `variant="cards"` resolves to a known set of classes. No inline style logic in components.
6. **Zod schema validates JSON at build time.** Invalid component names, missing required content fields, unknown layout values → build error, not runtime surprise.

## Template System

A template is a preset that controls design tokens and default variants — not a different set of components. All templates use the same component library.

### Template Definition

```ts
export interface Template {
  name: string
  tokens: Record<string, string>  // CSS custom property overrides
  defaults: Record<string, { variant?: string; layout?: string }>
}
```

### Starter Templates

**Modern** — Clean lines, subtle shadows, Inter font, moderate rounding. Professional and contemporary.

```ts
{
  name: "modern",
  tokens: { "--font-sans": "'Inter', sans-serif", "--radius-md": "0.5rem" },
  defaults: {
    Hero: { variant: "overlay", layout: "centered" },
    UnitGrid: { variant: "cards", layout: "3-col" },
    FeatureGrid: { variant: "icons", layout: "4-col" },
    CallToAction: { variant: "gradient", layout: "centered" },
  }
}
```

**Bold** — Sharp corners, strong borders, Space Grotesk font, high contrast. Industrial and confident.

```ts
{
  name: "bold",
  tokens: { "--font-sans": "'Space Grotesk', sans-serif", "--radius-md": "0" },
  defaults: {
    Hero: { variant: "split", layout: "image-left" },
    UnitGrid: { variant: "table", layout: "full-width" },
    FeatureGrid: { variant: "cards", layout: "3-col" },
    CallToAction: { variant: "solid", layout: "left-aligned" },
  }
}
```

**Friendly** — Generous rounding, soft shadows, DM Sans font, warm palette. Approachable and welcoming.

```ts
{
  name: "friendly",
  tokens: { "--font-sans": "'DM Sans', sans-serif", "--radius-md": "1rem" },
  defaults: {
    Hero: { variant: "wave", layout: "centered" },
    UnitGrid: { variant: "cards", layout: "2-col" },
    FeatureGrid: { variant: "pills", layout: "3-col" },
    CallToAction: { variant: "rounded", layout: "centered" },
  }
}
```

### Template Selection

Set in the facility JSON via `branding.template`. Each facility picks one template. Individual sections can override template defaults by specifying `variant` or `layout` directly in the section JSON.

## Deployment

### Netlify Configuration

**Umbrella site** (`apps/elevation-group`):
- `netlify.toml` in `apps/elevation-group/`
- Build command: `turbo build --filter=@jerry/elevation-group`
- Publish directory: `apps/elevation-group/out`
- Domain: `elevationgroup.com`
- Auto-deploys on push to main

**Standalone facilities** (`apps/facility-standalone`):
- `netlify.toml` in `apps/facility-standalone/`
- Build command: `turbo build --filter=@jerry/facility-standalone`
- Publish directory: `apps/facility-standalone/out`
- Environment variable: `FACILITY_SLUG=smithtown`
- Each standalone facility = separate Netlify site, same repo, different env var and custom domain

### Branding Toggle

`branding.showParent` in facility JSON controls parent branding visibility:
- `true` → "An Elevation Group Property" badge in header/footer
- `false` → fully white-labeled, no parent mention

## Integration Seams

The `integrations` field in the facility JSON is reserved for future storage management platform hookups (SiteLink, storEDGE, Hummingbird, etc.). The component architecture is designed so that sections like `UnitGrid` and `ContactForm` can switch from reading static `data.units` to querying a live API without changing the component interface.

## Testing Strategy

- **Zod validation** — build-time check of all facility JSON files
- **Component unit tests** — primitives and compositions tested in isolation
- **Snapshot tests** — sections rendered with sample JSON, snapshot compared
- **Lighthouse CI** — SEO, accessibility, performance scores on each build
- **E2E** — Playwright smoke tests for umbrella + standalone rendering

## Sample Facility Photos

Seed sample storage facility imagery (stock/Unsplash) will be used during development to provide realistic content for all three templates.
