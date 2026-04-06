# Landing Page Builder — Specification

## Vision

A config-driven landing page generator that assembles pages from pre-built sections harvested across the buzz-sites candidate projects. Ryan picks sections from a registry, fills in content slots, and the generator outputs a deployable Next.js page.

## Phase Roadmap

### V1 — Single Candidate (Build Now)
- **Section Registry**: 38 sections cataloged, **10 from sidebar-glass-gsap are V1-ready** (6 recipe-tier "ready", 4 page-inline "requires-refactor"). PageSection moved to V1.5 — it requires children, so the generator ships it only as a transitive dependency.
- **Pre-extraction**: Carve the 4 page-inline sections into standalone components before building the generator
- **Page Config**: JSON format defining section order + content overrides
- **Generator CLI**: Reads config → copies pre-extracted sections → outputs a Next.js project
- **Dependency Resolver**: Full transitive dependency graph, atom deduplication, npm package aggregation
- **Content-only editing**: Swap text/images in predefined slots, layout stays fixed
- **Path validation**: All source paths validated within candidate directory
- **Content sanitization**: Zod validation for page config, DOMPurify for rendered content

### V1.5 — Token Family Expansion
- Add 7 sidebar-glass sections (same token architecture, minimal bridging)
- Token-to-token bridge for minor naming differences between the two candidates
- Framer Motion as optional npm dependency (sidebar-glass sections use it)

### V2 — Classic Clean Integration
- React Router → Next.js framework adaptation for classic-clean components
- Monolith CSS extraction (carve relevant rules from 4,439-line CohesiveDesign.css)
- Contentful CMS hook removal (replace with props-based data)
- Cross-candidate theme bridge (custom-css → css-modules-tokens)

### V3 — Landing Version + Visual Builder
- Tailwind build pipeline integration (output project includes Tailwind config)
- Tailwind ↔ CSS Modules bridge with utility class resolution
- Visual drag-and-drop canvas with live preview
- Configurable section props (toggle features, change layout variants)

## What V1 Does NOT Include (Learned from Review)
- **No cross-candidate mixing** — all V1 sections share sidebar-glass-gsap token system
- **No Tailwind bridging** — utility classes need Tailwind compiler, not CSS variable bridges
- **No classic-clean sections** — React Router + monolith CSS requires framework rewrite
- **No chat widget extraction** — landing-version chat is an entire Clean Architecture feature
- **No "extractable: true" on page-inline sections** — they need refactoring first

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│              Section Registry                    │
│  _builder/registry/sections.json                │
│  - 38 sections across 4 candidates              │
│  - 10 V1-ready (sidebar-glass-gsap)             │
│  - extractionComplexity, layoutRelationships    │
└────────────────────┬────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────┐
│           Page Config (JSON)                     │
│  _builder/pages/<client-name>.json              │
│  { sections: [...], theme: "dark", meta: {...}} │
└────────────────────┬────────────────────────────┘
                     │
          ┌──────────┴──────────┐
          ▼                     ▼
┌─────────────────┐   ┌──────────────────┐
│  Generator CLI  │   │  Visual Preview   │
│  _builder/gen/  │   │  (V2 — stubbed)   │
│  → Next.js app  │   │  → drag-and-drop  │
└─────────────────┘   └──────────────────┘
```

---

## Section Registry Format

Each entry in `sections.json`:

```jsonc
{
  "id": "sidebar-glass-gsap:home-hero",
  "candidate": "sidebar-glass-gsap",
  "name": "HomeHero",
  "archetype": "hero",           // hero, gallery, features, form, map, nav, footer, banner, stats, timeline
  "tier": "recipe",             // atom, pattern, recipe, page-inline
  "description": "Full-screen carousel hero with 7 slides, scrim overlay, and vellum text plane",
  "thumbnail": null,            // path to screenshot (populated by registry-builder)
  "source": {
    "component": "src/system/recipes/HomeHero/HomeHero.tsx",
    "styles": ["src/system/recipes/HomeHero/HomeHero.module.css"],
    "dependencies": ["src/system/atoms/Button", "src/system/atoms/Image"],
    "tokens": ["src/styles/tokens/primitives.css", "src/styles/tokens/semantic.css"]
  },
  "contentSlots": {
    "title": { "type": "string", "default": "Rum River Wedding Barn" },
    "subtitle": { "type": "string", "default": "A venue for your whole story" },
    "slides": { "type": "image[]", "min": 1, "max": 10 },
    "ctaText": { "type": "string", "default": "Schedule a Tour" },
    "ctaHref": { "type": "string", "default": "#contact" }
  },
  "configSlots": {
    "autoPlayMs": { "type": "number", "default": 6000, "v2": true },
    "showDots": { "type": "boolean", "default": true, "v2": true }
  },
  "npmDeps": [],                           // npm packages this section requires
  "stylingSystem": "css-modules-tokens",  // css-modules-tokens, tailwind, custom-css
  "animation": "css-transitions",          // css-transitions, framer-motion, gsap, none
  "framework": "nextjs",                   // nextjs, react-router
  "extractable": true,                     // can be used as-is (recipe with own files)
  "selfContained": true,                   // no hidden dependencies on parent page layout
  "extractionComplexity": "ready",         // ready, requires-refactor, requires-rewrite
  "extractionNotes": "...",                // honest description of extraction work needed
  "layoutRelationships": {                 // how this section interacts with adjacent sections
    "overlapsAbove": "section-id",         // overlaps previous section via negative margin/mask
    "expectsOverlap": "description",       // expects next section to overlap it
    "affectsLayout": true,                 // sets CSS variables that affect page layout
    "setsVariable": "--var-name"           // CSS variable this section injects
  },
  "peerSections": ["section-id"],          // sections that naturally pair with this one
  "phase": "v1"                            // v1, v1.5, v2, v3
}
```

---

## Page Config Format

```jsonc
{
  "$schema": "./_builder/page-config.schema.json",
  "name": "acme-landing",
  "meta": {
    "title": "Acme Wedding Venue",
    "description": "Your dream wedding destination",
    "ogImage": "/images/og.jpg"
  },
  "theme": "dark",                // dark, light (maps to candidate theme system)
  "baseCandidate": "sidebar-glass-gsap",  // primary candidate for tokens/layout
  "sections": [
    {
      "registryId": "sidebar-glass-gsap:home-hero",
      "content": {
        "title": "Acme Wedding Barn",
        "subtitle": "Where memories begin",
        "slides": ["/images/hero-1.jpg", "/images/hero-2.jpg"],
        "ctaText": "Book a Tour"
      }
    },
    {
      "registryId": "landing-version:value-props",
      "content": {
        "heading": "Why Choose Acme",
        "cards": [
          { "title": "200 Acres", "description": "Sprawling grounds..." },
          { "title": "Full Weekend", "description": "Stay the whole time..." }
        ]
      }
    },
    {
      "registryId": "sidebar-glass-gsap:gallery-carousel",
      "content": {
        "accent": "Our Spaces",
        "title": "Every Corner Tells a Story",
        "cards": [
          { "src": "/images/barn.jpg", "title": "The Barn", "description": "..." }
        ]
      }
    },
    {
      "registryId": "sidebar-glass-gsap:tour-form",
      "content": {
        "accent": "Get in Touch",
        "title": "Schedule Your Visit"
      }
    }
  ]
}
```

---

## Theme Bridge

### V1: No Bridge Needed

All V1 sections come from sidebar-glass-gsap and share the same 4-tier token system (primitives → semantic → treatments → component). No cross-candidate bridging required.

### V1.5: Token-to-Token Bridge

sidebar-glass uses a single `tokens.css` file vs sidebar-glass-gsap's 4-tier split. A minimal `tokens-to-tokens.css` maps the few naming differences. Same token architecture — low risk.

### V2+: Cross-System Bridges (Deferred)

Cross-candidate bridging was found to be fundamentally broken for V1:
- **Tailwind utility classes** (`bg-amber-600`, `rounded-[2rem]`) are compiled by Tailwind — a CSS variable bridge cannot make them resolve. landing-version sections require Tailwind installed in the output project.
- **Monolith CSS** (classic-clean's 4,439-line CohesiveDesign.css) has no namespacing — extracting relevant rules per section requires static analysis.
- **CSS wrapper scoping** (`.bridge-*` class) does not prevent global selector bleeding via `!important` or element selectors.

These are deferred to V2/V3 with proper solutions:
- V2: Extract relevant CSS rules from classic-clean monolith during pre-extraction
- V3: Include Tailwind build pipeline in output project for landing-version sections

---

## Generator CLI

```bash
# Generate a new landing page from config
node _builder/gen/generate.mjs --config pages/acme-landing.json --out dist/acme-landing/

# Preview (dev server)
node _builder/gen/generate.mjs --config pages/acme-landing.json --preview

# List available sections
node _builder/gen/generate.mjs --list-sections

# Validate a page config
node _builder/gen/generate.mjs --validate pages/acme-landing.json
```

### Generator Steps

1. **Validate config** → Zod schema validation, sanitize content strings (DOMPurify)
2. **Resolve sections** → look up each `registryId` in the registry, reject if `phase` > current phase
3. **Validate paths** → ensure all `source.*` paths resolve within their candidate directory (reject `..` traversal)
4. **Build dependency graph** → walk transitive dependencies from each section, detect atom naming conflicts, deduplicate shared atoms
5. **Copy section files** → component TSX, CSS modules to `{output}/sections/{name}/`
6. **Copy shared atoms** → deduplicated atoms to `{output}/system/atoms/`
7. **Aggregate npm deps** → merge `npmDeps` from all sections into output `package.json`
8. **Generate page.tsx** → imports and composes all sections in order, respects `layoutRelationships`
9. **Generate layout.tsx** → sets up fonts, theme, metadata from config
10. **Copy tokens** → all 4 token tiers from sidebar-glass-gsap
11. **Generate API routes** → form submission endpoint if any form section is included
12. **Write to temp dir** → atomic operation, move to final output only on success
13. **Output** → complete Next.js app in output directory

### Safety Requirements

- **Path validation**: All source paths must `path.resolve()` within the candidate directory. Reject paths containing `..`
- **Content sanitization**: All user-supplied content strings validated with Zod, HTML-escaped before rendering in JSX
- **Atomic writes**: Generator writes to a temp directory, only moves to final output on full success. Partial failures leave no artifacts.
- **Dependency deduplication**: If two sections depend on the same atom (e.g., both use `Button`), verify they reference the same file. If two different candidates provide different `Button` implementations, fail the build with a clear error.

---

## Sub-Agent Team

See `.claude/skills/lp-builder/references/sub-agent-team.md` for full definitions.

| Agent | Role | Input | Output |
|-------|------|-------|--------|
| **Registry Builder** | Catalogs sections into registry JSON | Candidate source code | `sections.json` |
| **Recipe Extractor** | Copies recipe-tier sections (own component files) | Registry entry + source | Extracted component files |
| **Page Carver** | Carves page-inline sections into standalone components | Page source + CSS module | New component files |
| **Dependency Resolver** | Builds transitive dependency graph, npm aggregation | All extracted sections | Dependency manifest + package.json |
| **Page Assembler** | Composes final Next.js project | Config + extracted sections + deps | Next.js project |
| **QA Smoker** | Validates generated pages build and render | Generated project | Test results + screenshots |

---

## File Structure

```
buzz-sites/
├── _builder/
│   ├── SPEC.md                          # This file
│   ├── registry/
│   │   └── sections.json               # Section registry (all candidates)
│   ├── pages/                           # Page configs (one per client)
│   │   └── example.json
│   ├── bridges/                         # Theme bridge CSS (V1.5+)
│   │   └── tokens-to-tokens.css         # sidebar-glass → sidebar-glass-gsap
│   ├── gen/                             # Generator CLI
│   │   ├── generate.mjs                 # Main entry point
│   │   ├── validate-config.mjs          # Zod schema + content sanitization
│   │   ├── validate-paths.mjs           # Path traversal prevention
│   │   ├── resolve-deps.mjs             # Transitive dependency graph
│   │   ├── copy-sections.mjs            # Section + atom file copying
│   │   ├── assemble-page.mjs            # page.tsx + layout.tsx generation
│   │   └── aggregate-npm.mjs            # package.json dependency merger
│   ├── extracted/                       # Pre-extracted page-inline sections (V1 prep)
│   │   ├── proof-band/                  # Carved from page.tsx → standalone component
│   │   ├── setting-section/
│   │   ├── emotional-banner/
│   │   └── planning-section/
│   └── templates/                       # Output templates
│       ├── layout.tsx.ejs
│       ├── page.tsx.ejs
│       ├── next.config.mjs.ejs
│       └── package.json.ejs
├── .claude/
│   └── skills/
│       └── lp-builder/
│           ├── SKILL.md                 # Landing Page Builder planner agent
│           └── references/
│               ├── section-registry.md  # Registry format reference
│               ├── page-config.md       # Config format reference
│               ├── theme-bridge.md      # Bridge strategy reference
│               └── sub-agent-team.md    # Sub-agent definitions
└── candidates/                          # Source candidates (existing)
    ├── classic-clean/
    ├── landing-version/
    ├── sidebar-glass/
    └── sidebar-glass-gsap/
```
