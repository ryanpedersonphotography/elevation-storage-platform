# Portfolio Builder with Drag-and-Drop — Design Spec

**Date:** 2026-03-18
**Status:** Approved

## Overview

A portfolio site built with Next.js 15 (App Router) using the bulletproof-nextjs-starter as a foundation. Pages are built visually using the Puck drag-and-drop editor with three custom block types. Media can be associated with projects via a relational ID system. All content is file-based (JSON + local images) and git-trackable.

## Architecture

### Foundation

- **Starter:** [bulletproof-nextjs-starter](https://github.com/yeasin2002/bulletproof-nextjs-starter) (stripped down — see Dependencies section)
- **Architecture:** Vertical Slice (as used by the starter) — code organized by concern, blocks are self-contained
- **Editor:** [Puck](https://github.com/puckeditor/puck/) visual editor for drag-and-drop page building
- **Deployment:** Vercel with ISR
- **User model:** Single user (no auth for v1)

### Project Structure

```
src/
├── app/
│   ├── (site)/
│   │   └── [...slug]/              # Catch-all — renders published Puck pages
│   │       └── page.tsx
│   ├── edit/
│   │   └── [...slug]/              # Catch-all — Puck editor for any page
│   │       └── page.tsx
│   └── api/
│       ├── puck/
│       │   ├── route.ts            # GET/POST/DELETE page JSON
│       │   └── pages/
│       │       └── route.ts        # GET/POST page registry
│       └── upload/
│           └── route.ts            # POST image upload
├── components/
│   ├── ui/                         # shadcn/ui primitives
│   ├── magicui/                    # Magic UI animated components
│   ├── puck/
│   │   ├── ImageDetailBlock/
│   │   │   ├── index.tsx
│   │   │   ├── schema.ts
│   │   │   └── types.ts
│   │   ├── VideoDetailBlock/
│   │   │   ├── index.tsx
│   │   │   ├── schema.ts
│   │   │   └── types.ts
│   │   ├── ProjectBlock/
│   │   │   ├── index.tsx
│   │   │   ├── schema.ts
│   │   │   └── types.ts
│   │   ├── PageManager/
│   │   │   ├── index.tsx
│   │   │   └── types.ts
│   │   └── _shared/
│   │       └── schema.ts           # MediaMetaSchema
│   └── lightbox/
│       ├── LightboxProvider.tsx     # Single instance, URL-driven
│       ├── LightboxGallery.tsx      # yet-another-react-lightbox wrapper
│       ├── slides/
│       │   ├── ImageSlide.tsx       # next/image optimized
│       │   └── VideoSlide.tsx       # YouTube/Vimeo embed
│       └── MetaOverlay.tsx          # Magic UI animated caption/tags
├── lib/
│   ├── puck/
│   │   ├── config.ts               # Puck component config
│   │   ├── plugins/
│   │   │   └── project-linker.tsx   # Plugin rail: association overview
│   │   └── fields/
│   │       └── project-select.tsx   # Custom field: project dropdown
│   └── content/
│       └── pages.ts                # Read/write page JSON from /content
├── hooks/
│   └── use-project-media.ts        # Collect media by projectId
├── validations/
│   └── page.ts                     # Page registry schema
└── types/
    └── puck.ts                     # Shared Puck types

content/                            # Outside src/ — flat JSON files
├── _registry.json
├── photography.json
└── videography.json

public/
└── uploads/                        # Images uploaded via editor
```

## Data Model & Schemas

### Shared Schema

```ts
// src/components/puck/_shared/schema.ts
const MediaMetaSchema = z.object({
  caption: z.string().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).default([]),
});
```

### ImageDetailBlock

```ts
// src/components/puck/ImageDetailBlock/schema.ts
const ImageDetailSchema = z.object({
  id: z.string().uuid(),
  src: z.string().min(1),
  alt: z.string().min(1),
  width: z.number().positive().optional(),   // auto-populated via probe-image-size
  height: z.number().positive().optional(),  // auto-populated via probe-image-size
  hoverText: z.string().optional(),
  meta: MediaMetaSchema,
  projectId: z.string().uuid().nullable().default(null),
});
```

### VideoDetailBlock

```ts
// src/components/puck/VideoDetailBlock/schema.ts
const VideoDetailSchema = z.object({
  id: z.string().uuid(),
  url: z.string().url().refine(
    (url) => /(?:youtube\.com|youtu\.be|vimeo\.com)/.test(url),
    { message: "Only YouTube and Vimeo URLs are supported" }
  ),
  title: z.string().min(1),
  thumbnailSrc: z.string().optional(),  // custom or auto-extracted
  hoverText: z.string().optional(),
  meta: MediaMetaSchema,
  projectId: z.string().uuid().nullable().default(null),
});
```

**Thumbnail auto-extraction:**
- YouTube: `https://img.youtube.com/vi/{id}/maxresdefault.jpg`
- Vimeo: `vimeo.com/api/oembed.json?url=...` to get thumbnail URL
- Runs on field change in the editor, stored in `thumbnailSrc`

### ProjectBlock

```ts
// src/components/puck/ProjectBlock/schema.ts
const ProjectBlockSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  description: z.union([
    z.string().min(1),                    // plain text fallback
    z.array(z.record(z.unknown()))        // rich text node array from @tohuhono/puck-rich-text
  ]),
  coverImage: z.string().min(1),
  tags: z.array(z.string()).default([]),
  liveUrl: z.string().url().optional(),
  repoUrl: z.string().url().optional(),
  // No gallery array — associated media resolved at render time via projectId
});
```

### Page Registry

```ts
// src/validations/page.ts
const PageRegistryEntrySchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  createdAt: z.string().datetime(),
  lastModified: z.string().datetime(),
});

const PageRegistrySchema = z.object({
  pages: z.array(PageRegistryEntrySchema),
});
```

### Association Model

Media-to-project association is **relational, not nested**:
- ImageDetailBlock and VideoDetailBlock have a nullable `projectId` field
- ProjectBlock has no gallery array
- At render time, `useProjectMedia(projectId)` scans the current page data for all blocks with a matching `projectId`
- Associations are **per-page** (no cross-page linking in v1)

**Why this works:** Avoids deeply nested JSON. Moving an image between projects is a single ID change. AI can reason about flat structures more reliably.

## Puck Components & Editor UX

### Component Drawer

| Block | Icon | Label | Description |
|-------|------|-------|-------------|
| ImageDetailBlock | `Image` (Lucide) | Image Detail | Photo with hover text and lightbox |
| VideoDetailBlock | `Play` (Lucide) | Video Detail | YouTube/Vimeo with lightbox |
| ProjectBlock | `FolderOpen` (Lucide) | Project | Project card that collects associated media |

### ImageDetailBlock Editor Fields

| Field | Type | Notes |
|-------|------|-------|
| Image | File upload | Saves to `public/uploads/`, auto-populates width/height |
| Alt Text | text | Required |
| Hover Text | text | Optional hover overlay |
| Caption | text | Shown in lightbox |
| Description | textarea | Shown in lightbox |
| Tags | array of text | Metadata |
| Project | project-select (custom) | Dropdown of ProjectBlocks on page |

**Published behavior:** Image with optional hover overlay. Click opens lightbox with full image + meta. Shows project badge if linked.

### VideoDetailBlock Editor Fields

| Field | Type | Notes |
|-------|------|-------|
| Video URL | text | Validated for YouTube/Vimeo |
| Title | text | Required |
| Thumbnail | File upload | Optional — falls back to auto-extracted |
| Hover Text | text | Optional |
| Caption | text | Shown in lightbox |
| Description | textarea | Shown in lightbox |
| Tags | array of text | |
| Project | project-select | Same custom dropdown |

**Published behavior:** Thumbnail card with hover overlay. Click opens lightbox with embedded video + meta.

### ProjectBlock Editor Fields

| Field | Type | Notes |
|-------|------|-------|
| Title | text | Required |
| Description | rich-text | Via @tohuhono/puck-rich-text |
| Cover Image | File upload | Required |
| Tags | array of text | |
| Live URL | text | Optional |
| Repo URL | text | Optional |

**Published behavior:** Card with cover image + title + tags. Click opens ProjectLightbox showing project details + all associated media as a navigable gallery.

### Custom Field: project-select

`lib/puck/fields/project-select.tsx`

- Uses `usePuck` to read current page state
- Finds all components where `type === "ProjectBlock"`
- Renders a shadcn `<Select>` with "None" + each project's title
- Sets `projectId` on the current block
- Gracefully handles orphaned references (ProjectBlock deleted — media just becomes unlinked)

### Plugin: Project Linker

`lib/puck/plugins/project-linker.tsx`

A plugin rail panel showing a tree view of all associations:

```
FolderOpen My Photography Project
  ├── Image Sunset at the lake
  ├── Image Mountain trail
  └── Play Behind the scenes

FolderOpen Web Redesign
  └── Image Homepage mockup

CircleSlash Unlinked
  ├── Image Random photo
  └── Play Skateboard clip
```

Clicking an item selects it in the editor.

### Page Manager

`src/components/puck/PageManager/`

Wraps the Puck editor in `app/edit/[...slug]/page.tsx`:
- Lists all pages from registry, sorted by `lastModified`
- Highlights current page
- "New Page" button — dialog with slug + title, creates page, redirects to `/edit/{slug}`
- Delete button per page with confirmation
- Click any page to navigate to its editor

## Lightbox System

### Architecture

**URL-driven, single instance.** No `useState` for lightbox state.

```
src/components/lightbox/
├── LightboxProvider.tsx    # Reads URL params, single instance wrapping app
├── LightboxGallery.tsx     # yet-another-react-lightbox wrapper
├── slides/
│   ├── ImageSlide.tsx      # next/image optimized
│   └── VideoSlide.tsx      # YouTube/Vimeo embed detection
└── MetaOverlay.tsx         # Magic UI animated caption/tags reveal
```

### Flow

1. **User clicks** an ImageDetailBlock, VideoDetailBlock, or ProjectBlock
2. **URL updates** via `nuqs` — e.g., `?media=xyz-789` or `?project=abc-123`
3. **LightboxProvider** detects the query param change
4. **For projects:** `useProjectMedia(projectId)` scans page data for all blocks with matching `projectId`
5. **LightboxGallery** opens with the resolved slides
6. **Browser back** closes the lightbox naturally

### Benefits

- Deep-linkable — share a URL that opens directly to a specific image/project
- No prop drilling — blocks just update the URL
- AI-proof — simple URL manipulation, no complex state management

### Slide Types

- **ImageSlide:** Renders via `next/image` for performance. Full-size with meta overlay.
- **VideoSlide:** Detects YouTube vs Vimeo from URL, renders appropriate embed player.
- **MetaOverlay:** Magic UI animated text reveals caption, description, tags on slide change.

## Persistence & API

### API Routes

**Page data** — `src/app/api/puck/route.ts`:

| Method | Params | Action |
|--------|--------|--------|
| GET | `?slug=photography` | Load `content/{slug}.json` |
| POST | `?slug=photography`, body: Puck data | Validate with Zod, write JSON, update registry `lastModified`, call `revalidatePath` |
| DELETE | `?slug=photography` | Remove JSON file + registry entry |

**Page management** — `src/app/api/puck/pages/route.ts`:

| Method | Params | Action |
|--------|--------|--------|
| GET | — | Return full registry |
| POST | body: `{ slug, title }` | Create empty page + registry entry with timestamps |

**Image upload** — `src/app/api/upload/route.ts`:

| Method | Action |
|--------|--------|
| POST | Accept multipart form, save to `public/uploads/`, run `probe-image-size`, return `{ src, width, height }` |

### Validation Timing

- **On publish/save only** — full Zod validation of all component props
- **On upload** — image dimension extraction
- **Never on keystroke or drag** — keeps editor performance smooth

### ISR

- Published pages use `force-static`
- On publish, `revalidatePath('/{slug}')` busts the cache
- Next visit serves the fresh page

## Dependencies

### Add

| Package | Purpose |
|---------|---------|
| `@puckeditor/core` | Visual editor |
| `@tohuhono/puck-rich-text` | Rich text fields |
| `yet-another-react-lightbox` | Lightbox gallery |
| `nuqs` | URL query state for lightbox |
| `probe-image-size` | Auto-extract image dimensions |
| `framer-motion` | Animation (Magic UI dependency) |
| `eslint-plugin-boundaries` | Architecture enforcement |
| Magic UI components (copy-paste) | `magic-card`, animated text, `shine-border` |

### Already in Starter

| Package | Purpose |
|---------|---------|
| `zod` | Schema validation |
| `shadcn/ui` | Base UI primitives |
| `lucide-react` | Icons |
| `next-themes` | Dark mode |
| `vitest` | Unit tests |
| `playwright` | E2E tests |

### Remove from Starter

| Package | Why |
|---------|-----|
| Drizzle ORM + database config | File-based persistence |
| Better Auth | No auth for v1 |
| next-intl / i18n | English only |
| Stripe | No payments |
| Sentry, PostHog | Not needed for v1 |
| OpenTelemetry | Not needed |
| Storybook | Optional, add back later |
| Vercel Blob / UploadThing | Local uploads for v1 |

## ESLint Boundaries

```js
{
  "boundaries/elements": [
    { type: "puck-block", pattern: "src/components/puck/*" },
    { type: "shared-ui", pattern: "src/components/ui/*" },
    { type: "magic-ui", pattern: "src/components/magicui/*" },
    { type: "lightbox", pattern: "src/components/lightbox/*" },
    { type: "puck-lib", pattern: "src/lib/puck/*" },
    { type: "hooks", pattern: "src/hooks/*" }
  ]
}

// Rules:
// - puck-blocks can import: shared-ui, magic-ui, own files, _shared/
// - puck-blocks CANNOT import other puck-blocks
// - Only puck-lib imports from @puckeditor/core
// - lightbox is shared — importable by any block
// - hooks are shared — importable by any block or lightbox
```

## CLAUDE.md Rules

```markdown
## Architecture Rules
- Vertical Slice: each Puck block is self-contained (index.tsx, schema.ts, types.ts)
- NEVER import across block folders — shared code goes in _shared/
- Zod schemas are the source of truth — check schema.ts before writing component logic
- Only lib/puck/ may import from @puckeditor/core
- ESLint boundaries are enforced — if it errors, refactor, don't disable
- Magic UI components live in src/components/magicui/ — treated as shared UI
- Lightbox is URL-driven via nuqs — never use useState for lightbox state
- Content is file-based — all page data in /content/*.json
- Zod validation runs on save/publish only — never on keystroke or drag
```

## Watch-outs

1. **Vercel `public/uploads/` is read-only at runtime.** v1 assumes local editing + git commit workflow. If live editing on the deployed site is needed later, swap to Vercel Blob in the upload route.

2. **Zod + Puck performance.** Validation on save only, never during editing interactions.

3. **Rich text schema.** The `description` field on ProjectBlock uses `@tohuhono/puck-rich-text` which outputs structured data. The Zod schema uses a union type to accept both plain strings and rich text node arrays. Pin down the exact shape during implementation.

4. **Orphaned projectId references.** If a ProjectBlock is deleted, any media with its `projectId` still renders fine — it just won't appear in any project lightbox. No cascading deletes needed.

## Out of Scope (v1)

- Authentication on editor routes
- Cross-page media associations
- Image optimization pipeline (next/image handles it at render)
- Page JSON versioning (git history is the version control)
- AI page generation (Puck AI plugin — revisit for v2)
- Live editing on deployed site (requires Vercel Blob — v2)
