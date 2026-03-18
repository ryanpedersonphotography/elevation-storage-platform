# Portfolio Builder with Drag-and-Drop — Design Spec

**Date:** 2026-03-18
**Status:** Approved

## Overview

A portfolio site built with Next.js 15 (App Router) using the bulletproof-nextjs-starter as a foundation. Pages are built visually using the Puck drag-and-drop editor with three custom block types. Media can be associated with projects via a relational ID system. Page data is file-based (JSON) and git-trackable. Images are hosted on Cloudinary.

## Architecture

### Foundation

- **Starter:** [bulletproof-nextjs-starter](https://github.com/yeasin2002/bulletproof-nextjs-starter) (stripped down — see Dependencies section)
- **Architecture:** Vertical Slice (as used by the starter) — code organized by concern, blocks are self-contained
- **Editor:** [Puck](https://github.com/puckeditor/puck/) visual editor for drag-and-drop page building
- **Deployment:** Vercel with ISR
- **Media hosting:** [Cloudinary](https://cloudinary.com/) — upload widget in editor, CDN-served images with on-the-fly transformations
- **User model:** Single user (no auth for v1)

### Project Structure

```
src/
├── middleware.ts                       # Block /edit/ routes in production (must be at src/ root)
├── app/
│   ├── layout.tsx                     # Root layout — wraps with NuqsAdapter + PageDataProvider
│   ├── (site)/
│   │   └── [[...slug]]/             # Optional catch-all — handles / and /photography, /gym, etc.
│   │       └── page.tsx
│   ├── edit/
│   │   └── [...slug]/              # Catch-all — Puck editor for any page
│   │       └── page.tsx
│   └── api/
│       └── puck/
│           ├── route.ts            # GET/POST/DELETE page JSON
│           └── pages/
│               └── route.ts        # GET/POST page registry
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
│   │   ├── editor.tsx              # Wrapper: re-exports <Puck> for app routes
│   │   ├── renderer.tsx            # Wrapper: re-exports <Render> for app routes
│   │   ├── plugins/
│   │   │   └── project-linker.tsx   # Plugin rail: association overview
│   │   └── fields/
│   │       ├── project-select.tsx   # Custom field: project dropdown
│   │       └── cloudinary-image.tsx # Custom field: Cloudinary upload widget
│   └── content/
│       └── pages.ts                # Read/write page JSON from /content
├── hooks/
│   └── use-project-media.ts        # Collect media by projectId
├── validations/
│   └── page.ts                     # Page registry + Puck page data schemas
└── types/
    └── puck.ts                     # Shared Puck types (PuckPageData, MediaBlock union)

content/                            # Outside src/ — flat JSON files
├── _registry.json
├── photography.json
└── videography.json
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
  src: z.string().url(),                     // Cloudinary secure_url
  alt: z.string().min(1),
  width: z.number().positive().optional(),   // returned by Cloudinary upload widget
  height: z.number().positive().optional(),  // returned by Cloudinary upload widget
  cloudinaryPublicId: z.string().optional(), // for on-the-fly transformations
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
  description: z.record(z.unknown()),    // Puck built-in RichText field output (structured JSON)
  coverImage: z.string().min(1),
  tags: z.array(z.string()).default([]),
  liveUrl: z.string().url().optional(),
  repoUrl: z.string().url().optional(),
  // No gallery array — associated media resolved at render time via projectId
});
```

**Note:** `description` uses Puck's built-in `RichText` field type (available in @puckeditor/core 0.21+). The exact output shape will be pinned during implementation. No third-party rich text package needed.

### Puck Page Data Schema

```ts
// src/validations/page.ts
const PuckComponentSchema = z.object({
  type: z.string(),
  props: z.record(z.unknown()),          // validated per-component-type during save
});

const PuckPageDataSchema = z.object({
  root: z.object({ props: z.record(z.unknown()) }).passthrough(),
  content: z.array(PuckComponentSchema),
});
```

On save, the API route first validates the Puck envelope with `PuckPageDataSchema`, then walks `content` and validates each component's `props` against its specific block schema based on `type`.

### Cloudinary Integration

Images are uploaded and hosted via Cloudinary. No server-side upload route needed.

**Custom Puck Field:** `lib/puck/fields/cloudinary-image.tsx`

```ts
// Renders a button in the Puck sidebar that opens the Cloudinary Upload Widget.
// On successful upload, Cloudinary returns:
//   - secure_url (CDN URL)
//   - width, height (dimensions)
//   - public_id (for transformations)
// These are written directly to the component's props via onChange.

const CloudinaryImageField = ({ value, onChange, field }) => {
  const openWidget = () => {
    window.cloudinary.createUploadWidget(
      {
        cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
        uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET, // unsigned preset
        sources: ["local", "url", "camera", "google_drive"],
        multiple: false,
        maxFileSize: 10_000_000, // 10MB — enforced by Cloudinary
        resourceType: "image",
      },
      (error, result) => {
        if (!error && result?.event === "success") {
          onChange({
            src: result.info.secure_url,
            width: result.info.width,
            height: result.info.height,
            cloudinaryPublicId: result.info.public_id,
          });
        }
      }
    ).open();
  };
  // Renders preview thumbnail + "Upload Image" / "Change Image" button
};
```

**On-the-fly transformations:** In render components, append Cloudinary URL transformations for responsive sizing:
```
https://res.cloudinary.com/{cloud}/image/upload/w_800,c_limit,f_auto,q_auto/{public_id}
```
This ensures the portfolio never loads full-resolution originals — Cloudinary handles resizing, format conversion (WebP/AVIF), and quality optimization at the CDN edge.

**Environment variables required:**
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` — your Cloudinary cloud name
- `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` — an unsigned upload preset configured in Cloudinary dashboard

**Cloudinary script:** Loaded in `app/layout.tsx` via `<Script>` tag:
```tsx
<Script src="https://widget.cloudinary.com/v2.0/global/all.js" strategy="lazyOnload" />
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

Timestamps are ISO 8601 strings generated server-side via `new Date().toISOString()`.

### Association Model

Media-to-project association is **relational, not nested**:
- ImageDetailBlock and VideoDetailBlock have a nullable `projectId` field
- ProjectBlock has no gallery array
- At render time, `useProjectMedia(projectId)` scans the current page data for all blocks with a matching `projectId`
- Associations are **per-page** (no cross-page linking in v1)

**Why this works:** Avoids deeply nested JSON. Moving an image between projects is a single ID change. AI can reason about flat structures more reliably.

### Data Access on Published Pages

On the published site, the Puck `<Render>` component receives the full page data as a prop. To make this data accessible to `useProjectMedia` and the lightbox system, the published page layout wraps content in a `PageDataProvider` (React context) that holds the Puck data. The `useProjectMedia` hook reads from this context — it does NOT use `usePuck` (which is editor-only).

```
app/(site)/[...slug]/page.tsx
  → loads JSON from content/{slug}.json
  → wraps in <PageDataProvider data={pageData}>
    → <Render config={config} data={pageData} />
    → <LightboxProvider />  (reads URL params + page data context)
```

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
| Image | cloudinary-image (custom) | Opens Cloudinary widget, returns URL + dimensions |
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
| Thumbnail | cloudinary-image (custom) | Optional — falls back to auto-extracted from YouTube/Vimeo |
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
| Description | rich-text | Puck built-in RichText field (0.21+) |
| Cover Image | cloudinary-image (custom) | Required — uploaded via Cloudinary widget |
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

### SSR/Client Boundary

The lightbox URL params (`?media=`, `?project=`) are read **exclusively client-side** via `nuqs` using the `useSearchParams()` hook. The page-level `searchParams` prop must NEVER be used on published `(site)` routes, as it opts the route into dynamic rendering and breaks ISR. The `NuqsAdapter` must wrap the layout. Static HTML always renders with the lightbox closed; it opens only after client hydration.

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

**Image uploads** are handled entirely client-side via the Cloudinary Upload Widget — no server-side upload route needed.

### Validation Timing

- **On publish/save only** — full Zod validation of all component props
- **On image upload** — Cloudinary enforces file type and size limits via the upload preset configuration
- **Never on keystroke or drag** — keeps editor performance smooth

### ISR

- Published pages use `force-static`
- `generateStaticParams` reads the page registry and returns all known slugs
- `dynamicParams = true` so newly created pages are generated on first visit via ISR
- On publish, `revalidatePath('/{slug}')` busts the cache
- Next visit serves the fresh page

## Dependencies

### Add

| Package | Purpose |
|---------|---------|
| `@puckeditor/core` (0.21+) | Visual editor (includes built-in RichText field) |
| `yet-another-react-lightbox` | Lightbox gallery |
| `nuqs` | URL query state for lightbox |
| `framer-motion` | Animation (Magic UI dependency) |
| `eslint-plugin-boundaries` | Architecture enforcement |
| Magic UI components (copy-paste) | `magic-card`, animated text, `shine-border` |
| Cloudinary Upload Widget (script tag) | Image upload/hosting — no npm package needed |

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
| Vercel Blob / UploadThing | Using Cloudinary instead |

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
// - Only puck-lib imports from @puckeditor/core directly
// - App routes import from puck-lib (via editor.tsx / renderer.tsx wrappers), never from @puckeditor/core
// - lightbox is shared — importable by any block
// - hooks are shared — importable by any block or lightbox
```

## Error Handling

| Scenario | Behavior |
|----------|----------|
| Page JSON missing on load | Return 404, editor shows "Page not found" |
| Registry file missing | Auto-create empty `{ "pages": [] }` on first access |
| Zod validation fails on save | Return 400 with Zod error details, show toast in editor |
| Cloudinary upload fails | Widget shows its own error UI — no server handling needed |
| Orphaned `projectId` | Media renders normally, just doesn't appear in any project lightbox |
| Content directory missing | Auto-create `content/` on first API call |

## Editor Route Protection

In production, Next.js middleware blocks all `/edit/*` routes. This prevents information disclosure and unused editor UI on the deployed site.

```ts
// src/middleware.ts (at src/ root, NOT inside src/app/)
// If NODE_ENV === 'production', redirect /edit/* to /
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
- Images are hosted on Cloudinary — never store images locally
- Zod validation runs on save/publish only — never on keystroke or drag
```

## Watch-outs

1. **Cloudinary upload preset must be "unsigned."** This allows client-side uploads without server auth. Configure allowed file types and max size in the Cloudinary dashboard upload preset settings, not in code.

2. **Zod + Puck performance.** Validation on save only, never during editing interactions.

3. **Rich text schema.** The `description` field on ProjectBlock uses Puck's built-in RichText field (0.21+). The Zod schema uses `z.record(z.unknown())` as a placeholder. Pin down the exact output shape during implementation and tighten the schema.

4. **Orphaned projectId references.** If a ProjectBlock is deleted, any media with its `projectId` still renders fine — it just won't appear in any project lightbox. No cascading deletes needed.

5. **Cloudinary URL transformations.** Always use transformation parameters (`w_800,c_limit,f_auto,q_auto`) in render components to serve optimized images. Never render the raw upload URL — it may be a 10MB original.

6. **Content directory initialization.** The `content/` directory and `_registry.json` are auto-created on first API access if missing. No manual setup required.

7. **Cloudinary free tier.** The free plan includes 25 credits/month (roughly 25K transformations or 25GB storage). Sufficient for a personal portfolio. Monitor usage in the Cloudinary dashboard.

## Out of Scope (v1)

- Authentication on editor routes
- Cross-page media associations
- Page JSON versioning (git history is the version control)
- AI page generation (Puck AI plugin — revisit for v2)
