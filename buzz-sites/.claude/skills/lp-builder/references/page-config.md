# Page Config Reference

## Format

Page configs are JSON files stored in `{project-root}/_builder/pages/`. Each file defines one landing page.

## Schema

```jsonc
{
  // Required
  "name": "string",              // kebab-case identifier (used for output directory)
  "baseCandidate": "string",     // primary candidate for global tokens/layout
  "sections": [],                // ordered array of section references

  // Optional
  "meta": {
    "title": "string",           // <title> tag
    "description": "string",     // meta description
    "ogImage": "string"          // Open Graph image path
  },
  "theme": "dark" | "light",    // default: "dark"
  "nav": "sidebar" | "header" | "none",  // navigation style, default: "none"
  "footer": true | false         // include footer section, default: false
}
```

## Section Entry

```jsonc
{
  "registryId": "string",       // must match an ID in sections.json
  "content": {                   // content slot overrides (V1)
    // keys must match contentSlots defined in the registry entry
    // values replace defaults
  },
  "config": {                    // config slot overrides (V2 — ignored in V1)
    // keys must match configSlots defined in the registry entry
  },
  "id": "string"                // optional HTML id for anchor linking
}
```

## Validation Rules

1. `name` must be valid as a directory name (kebab-case, no spaces)
2. `baseCandidate` must be one of: `classic-clean`, `landing-version`, `sidebar-glass`, `sidebar-glass-gsap`
3. Every `registryId` in `sections` must exist in `sections.json`
4. Every required content slot (where no default exists) must have a value in `content`
5. Image paths in content must be relative to the output project's `public/` directory
6. At least one section is required

## Content Slot Types & Validation

| Type | JSON Type | Validation |
|------|-----------|------------|
| `string` | `"text"` | Non-empty string |
| `string[]` | `["a", "b"]` | Array of non-empty strings |
| `image` | `"/images/hero.jpg"` | String, valid path format |
| `image[]` | `["/img/1.jpg", "/img/2.jpg"]` | Array of image paths |
| `card` | `{"title": "...", "description": "..."}` | Object with required title |
| `card[]` | `[{...}, {...}]` | Array of card objects |
| `richCard` | `{"src": "...", "alt": "...", "title": "...", "description": "..."}` | Object with src + title |
| `richCard[]` | `[{...}, {...}]` | Array of richCard objects |

## Page Rhythm Guidelines

A well-composed landing page follows a rhythm. Recommended patterns:

### Standard (5-7 sections)
```
hero → stats/proof → features → gallery → form
```

### Full (8-10 sections)
```
hero → stats → features → gallery → banner → timeline → map → form → footer
```

### Minimal (3-4 sections)
```
hero → features → form
```

### Content-Heavy (7-9 sections)
```
hero → features → gallery → testimonials → timeline → map → vendors → form → footer
```

## Example: Minimal Page

```json
{
  "name": "pine-ridge-landing",
  "baseCandidate": "sidebar-glass-gsap",
  "theme": "dark",
  "meta": {
    "title": "Pine Ridge Wedding Venue",
    "description": "A rustic wedding venue nestled in the pines"
  },
  "sections": [
    {
      "registryId": "sidebar-glass-gsap:home-hero",
      "id": "home",
      "content": {
        "title": "Pine Ridge",
        "subtitle": "Where the pines meet the prairie",
        "slides": ["/images/hero-1.jpg", "/images/hero-2.jpg", "/images/hero-3.jpg"]
      }
    },
    {
      "registryId": "sidebar-glass-gsap:setting-section",
      "id": "features",
      "content": {
        "eyebrow": "The Venue",
        "title": "A Setting Like No Other",
        "body": "Surrounded by towering pines on 120 acres...",
        "features": [
          "Private lake access for ceremony backdrops",
          "Heated outdoor pavilion for year-round events",
          "On-site cabins for the wedding party",
          "Full commercial kitchen"
        ],
        "image": "/images/venue-aerial.jpg"
      }
    },
    {
      "registryId": "sidebar-glass-gsap:tour-form",
      "id": "contact",
      "content": {
        "accent": "Visit Us",
        "title": "Schedule Your Tour"
      }
    }
  ]
}
```
