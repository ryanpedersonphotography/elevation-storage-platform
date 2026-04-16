# Elevation Group Storage Facility Platform — Design Spec

## Overview

A modular Next.js platform for Elevation Group, a company that owns multiple self-storage facility properties. The platform renders facility websites from JSON configuration files, using shared components built on CVA primitives + Tailwind CSS v4. Facilities can be served as subdirectories under `elevationgroup.com` or as standalone sites on custom domains, all deployed to Netlify as static exports.

This is a standalone monorepo at `jerry-template/`. It does not extend the existing monorepo at `/Dev/websites/monorepo/` — that repo serves a different client base (landing page builder with Puck editor). This project has different requirements (JSON-driven config, no visual editor, storage-specific domain components) and a different deployment target (Netlify static export vs Vercel). Primitives may be extracted into a shared package later if the two repos converge, but that is out of scope.

## Architecture

### Monorepo Structure (Turborepo + Bun)

```
jerry-template/
├── apps/
│   ├── elevation-group/          # Umbrella site (elevationgroup.com)
│   └── facility-standalone/      # Template for custom-domain deploys
├── packages/
│   ├── storage-ui/               # Shared components (see internal structure below)
│   │   └── src/
│   │       ├── primitives/       # Layer 1: Heading, Text, Button, Image, etc.
│   │       ├── compositions/     # Layer 2: SectionHeader, Card, MediaBlock, etc.
│   │       ├── sections/         # Layer 3: Hero, UnitGrid, FeatureGrid, etc.
│   │       ├── templates/        # Template presets (modern.ts, bold.ts, friendly.ts)
│   │       ├── renderer/         # PageRenderer, component registry
│   │       ├── providers/        # FacilityProvider (React context)
│   │       ├── tokens.css        # Base design tokens
│   │       └── index.ts          # Barrel exports
│   ├── facility-config/          # Config types, Zod schemas, loader utilities
│   │   └── src/
│   │       ├── schema.ts         # Zod schema definitions
│   │       ├── loader.ts         # loadFacility(), loadAllFacilities()
│   │       ├── types.ts          # TypeScript types derived from Zod
│   │       ├── validate.ts       # CLI validation script (prebuild)
│   │       └── index.ts
│   └── tsconfig/                 # Shared TypeScript configs
├── data/
│   └── facilities/               # Per-facility JSON config files
│       ├── smithtown.json
│       ├── riverside.json
│       └── ...
├── turbo.json
├── package.json
└── .gitignore
```

### Tech Stack

| Tool | Version | Purpose |
|------|---------|---------|
| Turborepo | ^2 | Monorepo task orchestration |
| Bun | >=1.1.0 | Package manager + workspace manager |
| Next.js | ^15 | App Router, static export |
| React | ^19 | UI library |
| Tailwind CSS | v4 | CSS-first styling (no JS config) |
| CVA | ^0.7 | Variant recipes for component styling |
| Zod | ^3 | JSON config validation at build time |
| Lucide React | latest | Icon library |
| Vitest | ^3 | Unit and integration testing |
| Playwright | ^1 | E2E testing |

**Note on shadcn/ui:** Individual shadcn components may be installed via the shadcn CLI into `packages/storage-ui/src/primitives/` as a starting point, then customized. They are committed source files, not a runtime dependency. The shadcn CLI version used must support Tailwind v4 (v2.1+). Components are adapted to match this project's token system and prop conventions.

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
- `FACILITY_SLUG` is a **build-time only** environment variable, set in each Netlify site's dashboard. It is consumed only in `next.config.ts` and server-side data loading functions during `next build`. It must never be referenced in client components — it will be `undefined` in static HTML.

Both apps use the same `PageRenderer` and component library from `packages/storage-ui`. The only difference is how they resolve which facility config to load.

### Static Export

Both apps use `output: "export"` in `next.config.ts` with `generateStaticParams` to pre-render all pages at build time. Pure static HTML/CSS/JS served from Netlify's CDN — no server runtime needed.

**Implications for future integrations:** Live pricing/availability from storage management platforms (SiteLink, storEDGE, etc.) cannot be fetched at request time in a static export. Two options when that need arises: (a) ISR with Netlify serverless functions (requires switching from `output: "export"` to server-mode Next.js), or (b) client-side fetch at page load with loading states and CORS configuration. This decision must be made before adding live integrations.

## Facility JSON Configuration

Each facility is defined by a single JSON file in `data/facilities/[slug].json`. This file is the single source of truth for all content, pages, layouts, SEO, analytics, and branding.

### Full Schema

```json
{
  "slug": "smithtown",
  "name": "Smithtown Self Storage",

  "info": {
    "address": {
      "street": "123 Main St",
      "city": "Smithtown",
      "state": "NY",
      "zip": "11787"
    },
    "phone": "(631) 555-1234",
    "email": "smithtown@elevationgroup.com",
    "coordinates": { "lat": 40.855, "lng": -73.200 },
    "hours": [
      { "days": ["Mo", "Tu", "We", "Th", "Fr"], "open": "06:00", "close": "21:00" },
      { "days": ["Sa", "Su"], "open": "08:00", "close": "18:00" }
    ]
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
    "ogImage": "/images/smithtown/og-default.jpg"
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
            "heading": "Secure Storage in Smithtown",
            "subtitle": "Climate-controlled units starting at $49/mo",
            "image": { "src": "/images/smithtown/hero.jpg", "alt": "Smithtown facility exterior" },
            "cta": { "label": "Reserve Now", "href": "/smithtown/reserve", "variant": "primary" }
          }
        },
        "intro": {
          "component": "ContentSection",
          "layout": "image-right",
          "content": {
            "heading": "Welcome to Smithtown Self Storage",
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
            "heading": "Popular Unit Sizes",
            "blurb": "Find the perfect fit for your needs",
            "showPricing": true,
            "filter": ["5x5-indoor", "10x10-climate", "10x20-driveup"]
          }
        },
        "why-us": {
          "component": "FeatureGrid",
          "layout": "4-col",
          "content": {
            "heading": "Why Choose Us",
            "blurb": "Everything you need for worry-free storage",
            "features": [
              { "icon": "clock", "heading": "24-Hour Access", "blurb": "Access your unit any time" },
              { "icon": "camera", "heading": "HD Security", "blurb": "24/7 video surveillance" },
              { "icon": "thermometer", "heading": "Climate Controlled", "blurb": "Temp & humidity regulated" },
              { "icon": "shield", "heading": "Gated Entry", "blurb": "Personal access code for every tenant" }
            ]
          }
        },
        "cta": {
          "component": "CallToAction",
          "layout": "centered",
          "content": {
            "heading": "Ready to reserve your unit?",
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
      "layout": ["page-header", "unit-table", "size-guide", "cta"],
      "sections": {
        "page-header": {
          "component": "HeroSimple",
          "content": {
            "heading": "Unit Sizes & Pricing",
            "blurb": "Find the right unit for your needs and budget",
            "breadcrumb": true
          }
        },
        "unit-table": {
          "component": "UnitGrid",
          "variant": "table",
          "layout": "full-width",
          "content": {
            "heading": "All Available Units",
            "blurb": "Compare sizes, features, and monthly rates",
            "showPricing": true,
            "showFeatures": true
          }
        },
        "size-guide": {
          "component": "SizeGuide",
          "variant": "visual",
          "content": {
            "heading": "What Fits in Each Size?",
            "blurb": "A visual guide to help you choose",
            "guides": [
              { "size": "5x5", "description": "Boxes, small furniture, seasonal items", "fits": ["20 boxes", "Small dresser", "Bicycle"] },
              { "size": "10x10", "description": "One-bedroom apartment contents", "fits": ["Queen bed", "Couch", "Dining set", "50+ boxes"] },
              { "size": "10x20", "description": "Multi-bedroom home or vehicle", "fits": ["Full household", "Car or boat", "Business inventory"] }
            ]
          }
        },
        "cta": {
          "component": "CallToAction",
          "layout": "centered",
          "content": {
            "heading": "Found your size?",
            "blurb": "Reserve your unit online in minutes.",
            "cta": { "label": "Reserve Now", "href": "/smithtown/reserve", "variant": "primary" }
          }
        }
      }
    },
    "amenities": {
      "enabled": true,
      "seo": {
        "title": "Features & Amenities | Smithtown Self Storage",
        "description": "24-hour access, climate control, security cameras, and more.",
        "keywords": ["climate controlled storage", "24 hour storage access"]
      },
      "layout": ["page-header", "features", "gallery", "cta"],
      "sections": {
        "page-header": {
          "component": "HeroSimple",
          "content": {
            "heading": "Features & Amenities",
            "blurb": "Everything you need for secure, convenient storage",
            "breadcrumb": true
          }
        },
        "features": {
          "component": "FeatureGrid",
          "layout": "3-col",
          "variant": "cards",
          "content": {
            "heading": "Our Facility Features",
            "blurb": "Built with your convenience and security in mind"
          }
        },
        "gallery": {
          "component": "ContentSection",
          "layout": "image-left",
          "content": {
            "heading": "Take a Look Inside",
            "blurb": "Clean, well-lit, and professionally maintained.",
            "paragraphs": [
              "Our facility is inspected daily and maintained to the highest standards."
            ],
            "image": { "src": "/images/smithtown/interior-wide.jpg", "alt": "Wide view of interior storage hallway" }
          }
        },
        "cta": {
          "component": "CallToAction",
          "layout": "centered",
          "content": {
            "heading": "See it in person",
            "blurb": "Schedule a tour or reserve your unit today.",
            "cta": { "label": "Reserve a Unit", "href": "/smithtown/reserve", "variant": "primary" },
            "ctaSecondary": { "label": "Get Directions", "href": "/smithtown/directions", "variant": "outline" }
          }
        }
      }
    },
    "reserve": {
      "enabled": true,
      "seo": {
        "title": "Reserve a Unit | Smithtown Self Storage",
        "description": "Reserve your storage unit online or contact us to get started.",
        "keywords": ["reserve storage unit", "rent storage unit smithtown"]
      },
      "layout": ["page-header", "form", "info"],
      "sections": {
        "page-header": {
          "component": "HeroSimple",
          "content": {
            "heading": "Reserve a Unit",
            "blurb": "Fill out the form below and we'll get back to you within 24 hours",
            "breadcrumb": true
          }
        },
        "form": {
          "component": "ContactForm",
          "variant": "standard",
          "content": {
            "heading": "Request a Reservation",
            "blurb": "Tell us what you need and we'll hold a unit for you.",
            "fields": ["name", "email", "phone", "unitSize", "moveInDate", "message"],
            "submitLabel": "Request Reservation",
            "successMessage": "Thanks! We'll contact you within 24 hours to confirm."
          }
        },
        "info": {
          "component": "ContentSection",
          "layout": "stacked",
          "content": {
            "heading": "Prefer to call?",
            "blurb": "Our team is happy to help you find the right unit.",
            "paragraphs": [
              "Call us at (631) 555-1234 during business hours, or email smithtown@elevationgroup.com anytime."
            ]
          }
        }
      }
    },
    "directions": {
      "enabled": true,
      "seo": {
        "title": "Directions & Hours | Smithtown Self Storage",
        "description": "Find directions to Smithtown Self Storage. Located off Route 25.",
        "keywords": ["storage near me", "smithtown storage directions"]
      },
      "layout": ["page-header", "map", "hours-info"],
      "sections": {
        "page-header": {
          "component": "HeroSimple",
          "content": {
            "heading": "Directions & Hours",
            "blurb": "Conveniently located off Route 25 in Smithtown",
            "breadcrumb": true
          }
        },
        "map": {
          "component": "MapSection",
          "variant": "embedded",
          "content": {
            "heading": "Find Us",
            "blurb": "123 Main St, Smithtown, NY 11787",
            "directions": [
              { "from": "From I-495 East", "steps": "Take exit 56 toward Route 111 North. Turn right on Route 25. Facility is 0.5 miles on the left." },
              { "from": "From Route 25A", "steps": "Head south on Route 111. Turn left on Route 25. Facility is 0.3 miles on the right." }
            ]
          }
        },
        "hours-info": {
          "component": "ContentSection",
          "layout": "stacked",
          "content": {
            "heading": "Office & Access Hours",
            "blurb": "Gate access available 24/7 for tenants with a valid access code.",
            "paragraphs": [
              "Office hours: Monday–Friday 9am–6pm, Saturday 9am–4pm, Sunday Closed.",
              "Gate access: 24 hours a day, 7 days a week."
            ]
          }
        }
      }
    },
    "reviews": {
      "enabled": false
    }
  },

  "data": {
    "units": [
      { "id": "5x5-indoor", "size": "5x5", "sqft": 25, "price": 49, "features": ["indoor"] },
      { "id": "10x10-climate", "size": "10x10", "sqft": 100, "price": 99, "features": ["indoor", "climate-controlled"] },
      { "id": "10x20-driveup", "size": "10x20", "sqft": 200, "price": 159, "features": ["drive-up"] }
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

### Schema Design Decisions

**`info.hours`** — Array of structured objects with ISO 8601 day codes (`Mo`, `Tu`, etc.) and 24-hour time strings. This format is Zod-validatable, can be used to generate JSON-LD `openingHours`, and is programmatically usable for open/closed indicators.

**`data.units[].id`** — Each unit has a unique `id` (e.g., `"10x10-climate"`) that serves as the primary key. The `size` field (`"10x10"`) is for display. This supports facilities offering multiple units of the same size at different prices (e.g., ground-floor vs upper-floor). The `filter` field in `UnitGrid` content references unit IDs, not size strings. Filter values must exactly match IDs in `data.units`. If all filter values miss, the section shows all units as fallback.

**`seo.canonical`** — Not stored in JSON. Canonical URLs are computed at build time by the metadata generator based on `deployment.mode`:
- Subdirectory mode: `https://elevationgroup.com/[slug]/[page]`
- Standalone mode: `https://[deployment.domain]/[page]`

This prevents standalone sites from canonicalizing to the umbrella domain, which would destroy their search rankings.

**`integrations`** — Currently typed as `Record<string, never>` in Zod (empty by decree). When the first integration is implemented, it will become a discriminated union: `{ type: "sitelink", apiKey: "..." } | { type: "storedge", ... }`. See "Integration Seams" section for constraints.

### Disabled Pages

When a page has `"enabled": false`:
- It is excluded from `generateStaticParams` (no route generated, returns 404 on direct access)
- It is excluded from the navigation component
- It can still be defined with sections/content for future enablement

### SEO Resolution

Page-level `seo` fields **replace** (not merge) facility-level `seo` defaults on a per-field basis. Missing page-level fields fall back to facility defaults. `seo: {}` means full fallback to facility defaults for all fields.

| Field | Behavior |
|-------|----------|
| `title` | Page replaces facility `defaultTitle` |
| `description` | Page replaces facility `defaultDescription` |
| `keywords` | Page **replaces** facility keywords (not merged) |
| `ogImage` | Page replaces facility `ogImage` |

The renderer automatically generates:

- `<title>` and `<meta name="description">`
- `<meta name="keywords">` (joined with commas)
- Open Graph tags (`og:title`, `og:description`, `og:image`, `og:type`, `og:url`)
- Canonical URL (computed from deployment mode, not stored in JSON)
- JSON-LD structured data (see below)

### JSON-LD Structured Data

The renderer auto-composes a complete `LocalBusiness/SelfStorage` JSON-LD object from facility data. Most fields are auto-derived:

| JSON-LD Field | Source |
|---------------|--------|
| `name` | `facility.name` |
| `address` | `facility.info.address` (mapped to PostalAddress) |
| `telephone` | `facility.info.phone` |
| `email` | `facility.info.email` |
| `geo` | `facility.info.coordinates` |
| `openingHours` | `facility.info.hours` (converted from structured format to ISO 8601) |
| `url` | Computed from deployment mode |
| `priceRange` | Auto-derived from min/max of `data.units[].price` |
| `image` | `facility.seo.ogImage` |

The `seo.structuredData` field in the JSON provides **overrides only** for fields that cannot be auto-derived or need manual tuning.

### Analytics

**Data flow:** A `FacilityProvider` React context wraps the page at the layout level. It provides facility config (including `analytics`) to all descendants. Sections, compositions, and primitives that need to fire events use a `useAnalytics()` hook that reads from this context.

```tsx
// packages/storage-ui/src/providers/FacilityProvider.tsx
const FacilityContext = createContext<FacilityConfig | null>(null)

// packages/storage-ui/src/hooks/useAnalytics.ts
function useAnalytics() {
  const facility = useContext(FacilityContext)
  return {
    track: (event: string) => {
      if (facility?.analytics?.gtag && facility.analytics.gtagEvents?.[event]) {
        window.gtag?.('event', event)
      }
    }
  }
}
```

**Umbrella site per-facility gtag:** In the umbrella app, the `FacilityProvider` wraps the `[facility]` layout segment, not the root layout. Each facility route gets its own gtag ID from its config. The gtag script is loaded as a client component that reads the facility slug from the URL path and injects the corresponding `<Script>` tag. The umbrella site can additionally have its own root-level gtag in the root layout for aggregate tracking.

**No analytics = no script:** If `analytics.gtag` is omitted or null, no Google Analytics script is loaded.

### Zod Validation

#### Schema Definition

Located in `packages/facility-config/src/schema.ts`. Key types:

```ts
const ImageSchema = z.object({
  src: z.string().min(1),
  alt: z.string(), // can be empty for decorative images
})

const CTASchema = z.object({
  label: z.string().min(1),
  href: z.string().min(1),
  variant: z.enum(["primary", "secondary", "outline", "ghost"]),
})

const HoursSchema = z.object({
  days: z.array(z.enum(["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"])).min(1),
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

// Component enum derived from the registry — single source of truth
const ComponentName = z.enum(Object.keys(registry) as [string, ...string[]])

const SectionSchema = z.object({
  component: ComponentName,
  variant: z.string().optional(),
  layout: z.string().optional(),
  content: z.record(z.unknown()), // per-component content validated separately
})

const PageSchema = z.object({
  enabled: z.boolean(),
  seo: PageSeoSchema.optional(),
  layout: z.array(z.string()),
  sections: z.record(SectionSchema),
}).superRefine((page, ctx) => {
  // Cross-validate: every key in layout must exist in sections
  for (const key of page.layout) {
    if (!(key in page.sections)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Layout references section "${key}" but it is not defined in sections`,
      })
    }
  }
  // Warn: sections defined but not in layout (dead code)
  for (const key of Object.keys(page.sections)) {
    if (!page.layout.includes(key)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Section "${key}" is defined but not referenced in layout (dead section)`,
      })
    }
  }
})
```

#### Per-Component Content Schemas

Each section component defines its own content schema. These are registered alongside the component:

```ts
// packages/storage-ui/src/sections/Hero.tsx
export const HeroContentSchema = z.object({
  heading: z.string().min(1),       // required
  subtitle: z.string().optional(),
  image: ImageSchema,               // required
  cta: CTASchema.optional(),
})

// packages/storage-ui/src/sections/ContentSection.tsx
export const ContentSectionContentSchema = z.object({
  heading: z.string().min(1),       // required
  blurb: z.string().optional(),
  paragraphs: z.array(z.string()).optional(),
  image: ImageSchema.optional(),
})

// packages/storage-ui/src/sections/ContactForm.tsx
export const ContactFormContentSchema = z.object({
  heading: z.string().min(1),
  blurb: z.string().optional(),
  fields: z.array(z.enum(["name", "email", "phone", "unitSize", "moveInDate", "message"])),
  submitLabel: z.string().min(1),
  successMessage: z.string().min(1),
})

// packages/storage-ui/src/sections/MapSection.tsx
export const MapSectionContentSchema = z.object({
  heading: z.string().min(1),
  blurb: z.string().optional(),
  directions: z.array(z.object({
    from: z.string().min(1),
    steps: z.string().min(1),
  })).optional(),
})

// packages/storage-ui/src/sections/HeroSimple.tsx
export const HeroSimpleContentSchema = z.object({
  heading: z.string().min(1),
  blurb: z.string().optional(),
  breadcrumb: z.boolean().optional(),
})

// packages/storage-ui/src/sections/SizeGuide.tsx
export const SizeGuideContentSchema = z.object({
  heading: z.string().min(1),
  blurb: z.string().optional(),
  guides: z.array(z.object({
    size: z.string().min(1),
    description: z.string().min(1),
    fits: z.array(z.string()),
  })),
})

// packages/storage-ui/src/sections/TestimonialGrid.tsx
export const TestimonialGridContentSchema = z.object({
  heading: z.string().min(1),
  blurb: z.string().optional(),
  limit: z.number().positive().optional(),
})
```

The content schema registry maps component names to their content schema, enabling per-section content validation during the prebuild step.

#### Validation Call Site

Validation runs as a Turborepo `validate` task, configured as a dependency of `build`:

```jsonc
// turbo.json
{
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
    "type-check": { "dependsOn": ["^build"] }
  }
}
```

The `validate` task runs `packages/facility-config/src/validate.ts` which reads all `data/facilities/*.json` files, runs the full Zod schema (including cross-field `layout`↔`sections` validation and per-component content validation), and exits non-zero on any error.

**Critical: `env` declaration.** The `build` task declares `"env": ["FACILITY_SLUG"]` so Turborepo includes this variable in the cache key. Without this, two standalone facility builds from the same repo would cache-poison each other — Turbo would serve smithtown's cached output for riverside's build because the source file hashes are identical.

## Component Architecture

Four-layer hierarchy. Each layer builds on the one below it. No layer skips levels.

### Layer 1: Primitives (Design Tokens + Base Elements)

Located in `packages/storage-ui/src/primitives/`.

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
| `Button` | Actions, CVA variant recipes | `variant` (primary/secondary/outline/ghost), `size` (sm/md/lg), `href?`, `onClick?`, `children` |
| `Image` | Enforces alt text, lazy loading, aspect ratios | `src`, `alt`, `aspect?` (16/9, 4/3, 1/1, 3/1), `priority?` |
| `Container` | Max-width wrapper with padding from tokens | `size` (sm/md/lg/xl), `children` |
| `Stack` | Vertical layout | `gap`, `align?`, `children` |
| `Cluster` | Horizontal layout | `gap`, `align?`, `justify?`, `children` |
| `Grid` | Responsive grid with column recipes | `cols`, `gap`, `children` |
| `Section` | Page section wrapper with vertical spacing. Optionally renders a background image via the `Image` primitive internally. | `background?` (`{ src, alt }`), `overlay?` (dark/light), `children` |

### Layer 2: Compositions (Reusable Patterns)

Located in `packages/storage-ui/src/compositions/`. Compose primitives into reusable UI patterns. Uses children and slots for flexibility.

| Composition | Purpose | Interface |
|-------------|---------|-----------|
| `SectionHeader` | Heading + optional blurb, used by every section that has a heading | Props: `heading` (string), `description?` (string), `level?` (number, defaults to 2) |
| `Card` | Generic card with compound component slots | `Card.Image`, `Card.Body`, `Card.Title`, `Card.Description`, `children` for footer slot |
| `MediaBlock` | Image + content, layout-aware | `MediaBlock.Image`, `MediaBlock.Content` (children slot). `layout`: image-right, image-left, stacked |
| `FeatureItem` | Icon + heading + text | Props: `icon` (string). Children for heading + text |
| `CTAGroup` | One or two CTA buttons, consistent spacing. **Data-driven interface** for JSON compatibility. | Props: `primary` (`{ label, href, variant }`), `secondary?` (`{ label, href, variant }`). Renders `Button` primitives internally. |

**Note on CTAGroup:** Because the content model is JSON-driven, `CTAGroup` accepts structured data props (not children). It constructs `Button` elements internally from the `cta` and `ctaSecondary` content fields. This keeps sections simple — they pass `content.cta` directly without manual element construction.

### Layer 3: Sections (JSON-Driven, Pre-Designed)

Located in `packages/storage-ui/src/sections/`. Each section is a pre-designed component that receives `content`, `layout`, and `variant` from the facility JSON. Sections compose primitives and compositions — zero custom CSS, zero hardcoded text. Each section exports a companion Zod content schema (see Zod Validation section above).

| Section | Purpose | Variants | Content Schema |
|---------|---------|----------|----------------|
| `Hero` | Full-width hero with background image | overlay, split, wave | `HeroContentSchema` |
| `HeroSimple` | Compact page header with optional breadcrumb | minimal, colored | `HeroSimpleContentSchema` |
| `ContentSection` | Text + optional image, flexible layout | clean, bordered, soft | `ContentSectionContentSchema` |
| `UnitGrid` | Storage unit sizes & pricing (reads from `facilityData.data.units`) | cards, table, compact | `UnitGridContentSchema` |
| `FeatureGrid` | Amenities/features grid (reads from `facilityData.data.amenities`) | icons, cards, pills | `FeatureGridContentSchema` |
| `CallToAction` | CTA banner with primary + optional secondary button | gradient, solid, rounded | `CallToActionContentSchema` |
| `ContactForm` | Reserve/contact form (client component) | standard, minimal | `ContactFormContentSchema` |
| `MapSection` | Embedded map + directions | embedded, static | `MapSectionContentSchema` |
| `TestimonialGrid` | Reviews/testimonials (reads from `facilityData.data.testimonials`) | cards, quotes | `TestimonialGridContentSchema` |
| `SizeGuide` | Visual unit size comparison | visual, table | `SizeGuideContentSchema` |
| `FacilityDirectory` | Facility locator (umbrella app only — see enforcement below) | cards, list, map | `FacilityDirectoryContentSchema` |

**FacilityDirectory enforcement:** The Zod schema for standalone facilities excludes `FacilityDirectory` from its component enum. If a standalone facility JSON references `FacilityDirectory`, validation fails at build time with a descriptive error. The umbrella app's schema includes it.

### Layer 4: PageRenderer (The Engine)

Located in `packages/storage-ui/src/renderer/PageRenderer.tsx`.

```tsx
import { registry, type SectionComponent } from './registry'

function PageRenderer({ page, facilityData, template }: PageRendererProps) {
  return (
    <>
      {page.layout.map(sectionKey => {
        const section = page.sections[sectionKey]
        const Component = registry[section.component]

        if (!Component) {
          throw new Error(
            `Unknown component "${section.component}" in section "${sectionKey}". ` +
            `Available: ${Object.keys(registry).join(', ')}`
          )
        }

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

**Registry/schema sync:** The Zod `ComponentName` enum is derived from `Object.keys(registry)`, ensuring they can never diverge. Adding a new section component to the registry automatically makes it valid in JSON. Removing one automatically invalidates existing JSON references at build time.

**Variant/layout resolution order (most specific wins):**
1. Section JSON (`section.variant` / `section.layout`)
2. Template defaults (`template.defaults[Component]`)
3. Component default props

## DRY Enforcement Rules

These are mandatory architectural constraints, not suggestions:

1. **Primitives own typographic and layout styling.** Sections never use raw HTML for typographic or layout elements. `<h2>` → `<Heading level={2}>`. `<p>` → `<Text>`. `<img>` → `<Image>`. Structural HTML (`<nav>`, `<header>`, `<footer>`, `<ul>`, `<li>`, `<form>`, `<input>`, `<label>`, `<a>`) may be used directly but must apply token-based Tailwind classes — no arbitrary values.
2. **Compositions prevent pattern duplication.** heading+blurb → `SectionHeader`. Icon+title+text → `FeatureItem`. Image+content side-by-side → `MediaBlock`. CTA buttons → `CTAGroup`. No section reimplements these patterns.
3. **Children + slots for flexibility.** `Card.Body` accepts children for custom content. `MediaBlock.Content` is a slot. `Section` wraps any children. Compositions are flexible without being unpredictable.
4. **Tokens constrain all visual decisions.** Spacing only uses token values (`gap="lg"`, not `gap="37px"`). Colors only from brand palette. Font sizes from type scale. No magic numbers, no one-off values.
5. **Variant recipes via CVA, not conditional CSS.** CVA recipes define variant → className maps. `variant="cards"` resolves to a known set of classes. No inline style logic in components.
6. **Zod schema validates JSON at build time.** Invalid component names, missing required content fields, unknown layout values, layout↔sections key mismatches → build error, not runtime surprise.

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

### Token & Color Injection

Templates and facility brand colors are injected as CSS custom properties via a `<style>` tag in the root layout:

```tsx
// In layout.tsx
<style dangerouslySetInnerHTML={{ __html: `
  :root {
    ${Object.entries(template.tokens).map(([k, v]) => `${k}: ${v};`).join('\n    ')}
    ${facility.branding.colors.primary ? `--color-primary: ${facility.branding.colors.primary};` : ''}
    ${facility.branding.colors.accent ? `--color-accent: ${facility.branding.colors.accent};` : ''}
  }
`}} />
```

**Resolution order:** Base `tokens.css` (via `@theme`) → template token overrides (via `:root`) → facility color overrides (via `:root`, same `<style>` tag, listed after template tokens). Facility colors always win.

**Mapping:** `branding.colors.primary` → `--color-primary`. `branding.colors.accent` → `--color-accent`. This is the complete set of color overrides. All other tokens (spacing, radii, fonts) come from the template.

**Tailwind v4 note:** `:root` custom property overrides work with Tailwind v4's `@theme` because Tailwind resolves `var()` references at build time for static values and at runtime for dynamic values. The `:root` overrides from the `<style>` tag apply at runtime in the browser, which means Tailwind utility classes that reference these tokens (e.g., `bg-primary`, `text-accent`) work correctly because they compile to `var(--color-primary)` etc.

### Starter Templates

**Modern** — Clean lines, subtle shadows, Inter font, moderate rounding. Professional and contemporary.

```ts
{
  name: "modern",
  tokens: {
    "--font-sans": "'Inter', sans-serif",
    "--radius-sm": "0.25rem",
    "--radius-md": "0.5rem",
    "--radius-lg": "0.75rem",
  },
  defaults: {
    Hero: { variant: "overlay", layout: "centered" },
    ContentSection: { variant: "clean", layout: "image-right" },
    UnitGrid: { variant: "cards", layout: "3-col" },
    FeatureGrid: { variant: "icons", layout: "4-col" },
    CallToAction: { variant: "gradient", layout: "centered" },
    Card: { variant: "shadow", layout: "vertical" },
  }
}
```

**Bold** — Sharp corners, strong borders, Space Grotesk font, high contrast. Industrial and confident.

```ts
{
  name: "bold",
  tokens: {
    "--font-sans": "'Space Grotesk', sans-serif",
    "--radius-sm": "0",
    "--radius-md": "0",
    "--radius-lg": "0",
  },
  defaults: {
    Hero: { variant: "split", layout: "image-left" },
    ContentSection: { variant: "bordered", layout: "image-left" },
    UnitGrid: { variant: "table", layout: "full-width" },
    FeatureGrid: { variant: "cards", layout: "3-col" },
    CallToAction: { variant: "solid", layout: "left-aligned" },
    Card: { variant: "bordered", layout: "horizontal" },
  }
}
```

**Friendly** — Generous rounding, soft shadows, DM Sans font, warm palette. Approachable and welcoming.

```ts
{
  name: "friendly",
  tokens: {
    "--font-sans": "'DM Sans', sans-serif",
    "--radius-sm": "0.5rem",
    "--radius-md": "1rem",
    "--radius-lg": "1.5rem",
  },
  defaults: {
    Hero: { variant: "wave", layout: "centered" },
    ContentSection: { variant: "soft", layout: "stacked" },
    UnitGrid: { variant: "cards", layout: "2-col" },
    FeatureGrid: { variant: "pills", layout: "3-col" },
    CallToAction: { variant: "rounded", layout: "centered" },
    Card: { variant: "rounded", layout: "vertical" },
  }
}
```

### Template Selection

Set in the facility JSON via `branding.template`. Each facility picks one template. Individual sections can override template defaults by specifying `variant` or `layout` directly in the section JSON.

## Deployment

### Netlify Configuration

**Important:** Each Netlify site must have its **"Base directory"** configured in the Netlify dashboard to point to the correct app directory. Without this, Netlify reads `netlify.toml` from the repo root and ignores per-app configs.

**Umbrella site** (`apps/elevation-group`):
- Netlify Base directory: `apps/elevation-group`
- `netlify.toml` in `apps/elevation-group/`
- Build command: `cd ../.. && turbo build --filter=@jerry/elevation-group`
- Publish directory: `out`
- Domain: `elevationgroup.com`
- Auto-deploys on push to main

**Standalone facilities** (`apps/facility-standalone`):
- Netlify Base directory: `apps/facility-standalone`
- `netlify.toml` in `apps/facility-standalone/`
- Build command: `cd ../.. && turbo build --filter=@jerry/facility-standalone`
- Publish directory: `out`
- Environment variable (set in Netlify dashboard): `FACILITY_SLUG=smithtown`
- Each standalone facility = separate Netlify site, same repo, different env var and custom domain

### Branding Toggle

`branding.showParent` in facility JSON controls parent branding visibility:
- `true` → "An Elevation Group Property" badge in header/footer
- `false` → fully white-labeled, no parent mention

### Provisioning a New Facility

1. Create `data/facilities/[slug].json` with full facility config
2. Add facility images to `public/images/[slug]/` in the appropriate app
3. Run `bun run validate` to check the JSON schema
4. For subdirectory facilities: commit and push — the umbrella site auto-deploys with the new facility
5. For standalone facilities:
   a. Create a new Netlify site from the same repo
   b. Set Base directory to `apps/facility-standalone`
   c. Set environment variable `FACILITY_SLUG=[slug]`
   d. Configure the custom domain in Netlify
   e. Push — Netlify builds and deploys the standalone site
6. If `FACILITY_SLUG` is unset or points to a nonexistent JSON file, the build fails with a descriptive Zod error at the validation step

## Integration Seams

The `integrations` field in the facility JSON is reserved for future storage management platform hookups (SiteLink, storEDGE, Hummingbird, etc.).

**Static export constraint:** In the current `output: "export"` architecture, live API data cannot be fetched at request time. When live integrations are needed, the architectural options are:
- **Option A: ISR** — Switch from `output: "export"` to server-mode Next.js with Netlify serverless functions. Enables `revalidate` for near-real-time pricing.
- **Option B: Client-side fetch** — Keep static export. Add client components that fetch pricing/availability on page load. Requires CORS configuration, loading states, and error handling.

This decision must be made before implementing the first integration. The component interface (props) will not change — only the data source behind `facilityData.data.units`.

## Testing Strategy

### Framework and Fixtures

- **Test framework:** Vitest for unit and integration tests
- **E2E framework:** Playwright
- **Test fixtures:** `data/fixtures/test-facility.json` — a complete, valid facility config used across all test types. One fixture per template for template-specific tests.

### Test Types

| Type | Scope | What It Validates |
|------|-------|-------------------|
| **Zod schema tests** | `packages/facility-config` | Valid fixtures pass. Invalid fixtures (missing required fields, unknown components, layout↔sections mismatch, malformed hours, missing unit IDs) fail with expected error messages. |
| **Primitive unit tests** | `packages/storage-ui/src/primitives` | Correct HTML semantics (heading levels, alt text presence), CVA variant class application, token-based prop mapping. |
| **Composition unit tests** | `packages/storage-ui/src/compositions` | Slot rendering, compound component assembly, layout prop behavior. |
| **Section integration tests** | `packages/storage-ui/src/sections` | Each section renders correct structure from fixture JSON. Validates heading hierarchy, alt text, CTA links, data binding from `facilityData`. Uses axe-core for accessibility checks. |
| **PageRenderer tests** | `packages/storage-ui/src/renderer` | Layout ordering, variant resolution (JSON → template → default), unknown component error, disabled page exclusion. |
| **Route generation tests** | `apps/*/` | `generateStaticParams` output includes all enabled pages, excludes disabled pages, handles all deployment modes correctly. |
| **E2E smoke tests** | Full apps | Playwright: pages render with correct heading content, gtag script present when configured, canonical URLs correct per deployment mode, navigation excludes disabled pages, 404 on disabled page direct access. |
| **Lighthouse CI** | Full apps | SEO score ≥ 90, accessibility score ≥ 90, performance score ≥ 80 on each build. |

### Per-Template Coverage

Section integration tests run once per template to verify that template defaults apply correctly and produce valid output for each variant combination.

## Asset Conventions

### Image Storage

Images are committed to the repo under `public/images/[facility-slug]/` in the appropriate app directory.

### Naming Convention

| Use | Filename | Recommended Dimensions | Aspect |
|-----|----------|----------------------|--------|
| Hero background | `hero.jpg` | 1920×1080 | 16:9 |
| CTA background | `cta-bg.jpg` | 1920×640 | 3:1 |
| Inline content | `interior.jpg`, `exterior.jpg` | 800×600 | 4:3 |
| Logo | `logo.png` | 400×100 max | any |
| OG image | `og-default.jpg`, `og-[page].jpg` | 1200×630 | ~1.91:1 |

All images referenced in facility JSON (`content.image.src`, `seo.ogImage`, etc.) must exist at the specified path. Missing images cause broken layouts but not build failures (validated by E2E smoke tests, not Zod).

### Seed Photos

Stock storage facility imagery (from Unsplash or similar) will be committed during development to provide realistic content for all three templates. These are placeholder assets for development/demo only.
