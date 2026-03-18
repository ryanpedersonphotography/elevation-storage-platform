# Portfolio Builder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a drag-and-drop portfolio site using Puck editor with Cloudinary-hosted images, URL-driven lightbox, and file-based JSON persistence.

**Architecture:** Next.js 15 App Router with vertical slice organization. Puck handles page building with three custom blocks (ImageDetail, VideoDetail, Project). Media associates to projects via `projectId` references resolved at render time. Cloudinary handles all image uploads client-side. Pages are statically generated with ISR.

**Tech Stack:** Next.js 15, React 19, Puck 0.21+, Zod, shadcn/ui, Magic UI, Tailwind CSS, Cloudinary Upload Widget, nuqs, yet-another-react-lightbox, ESLint + eslint-plugin-boundaries, Vitest, Playwright

**Spec:** `docs/superpowers/specs/2026-03-18-portfolio-builder-design.md`

---

## Phase 1: Project Scaffolding

### Task 1: Clone Starter & Strip Bloat

**Files:**
- Modify: `package.json`
- Delete: `src/db/` (entire directory)
- Delete: `src/i18n/` (entire directory)
- Delete: `src/stories/` (entire directory)

- [ ] **Step 1: Clone the bulletproof-nextjs-starter**

```bash
cd /Users/ryanpederson/Dev/websites/showcase-port
git clone https://github.com/yeasin2002/bulletproof-nextjs-starter.git temp-starter
cp -r temp-starter/. .
rm -rf temp-starter
rm -rf .git
git init
```

- [ ] **Step 2: Remove unused dependencies**

Remove database packages:
```bash
npm uninstall drizzle-orm drizzle-kit @libsql/client @libsql/client-wasm @neondatabase/serverless @planetscale/database @prisma/client @tidbcloud/serverless @xata.io/client @aws-sdk/client-rds-data @cloudflare/workers-types @edge-runtime/vm @op-engineering/op-sqlite @types/pg pg postgres knex kysely gel @upstash/redis
```

Remove auth/payments/analytics/i18n:
```bash
npm uninstall next-intl @opentelemetry/api react-scan @react-email/components
```

Remove Storybook:
```bash
npm uninstall storybook @storybook/nextjs-vite @storybook/addon-a11y @storybook/addon-docs @storybook/addon-links @storybook/addon-onboarding @storybook/addon-vitest @chromatic-com/storybook eslint-plugin-storybook
```

Remove other unused:
```bash
npm uninstall codehawk-cli knip arktype bun-types dotenv @svgr/webpack
```

- [ ] **Step 3: Delete unused directories and files**

```bash
rm -rf src/db src/i18n src/stories
```

Remove any Drizzle config files (`drizzle.config.ts`), Storybook config (`.storybook/`), and i18n config files.

- [ ] **Step 4: Install project dependencies**

```bash
npm install @puckeditor/core yet-another-react-lightbox nuqs framer-motion
npm install -D eslint-plugin-boundaries
```

- [ ] **Step 5: Verify the app builds**

```bash
npm run build
```

Expected: Build succeeds (fix any import errors from deleted modules).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: scaffold from bulletproof-nextjs-starter, strip unused deps"
```

---

### Task 2: Environment & Configuration

**Files:**
- Create: `.env.local`
- Create: `CLAUDE.md`
- Create: `content/_registry.json`

- [ ] **Step 1: Create `.env.local`**

```env
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dhe4hjdzv
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=normal
```

- [ ] **Step 2: Create `CLAUDE.md` at project root**

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

- [ ] **Step 3: Create initial content directory**

```bash
mkdir -p content
```

Create `content/_registry.json` with a seeded home page:
```json
{
  "pages": [
    {
      "slug": "home",
      "title": "Home",
      "createdAt": "2026-03-18T00:00:00.000Z",
      "lastModified": "2026-03-18T00:00:00.000Z"
    }
  ]
}
```

Create `content/home.json` with empty Puck data:
```json
{
  "root": { "props": {} },
  "content": [],
  "zones": {}
}
```

- [ ] **Step 4: Create `.env.example`**

```env
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
```

- [ ] **Step 5: Add content to `.gitignore`**

Ensure `.env.local` is in `.gitignore` (Next.js default). Do NOT gitignore `content/` — it's meant to be tracked.

- [ ] **Step 6: Commit**

```bash
git add CLAUDE.md .env.example content/
git commit -m "chore: add CLAUDE.md rules, env example, seed home page"
```

---

### Task 2b: ESLint Boundaries (Early Setup)

**Files:**
- Modify: ESLint config (`.eslintrc.js` or `eslint.config.mjs` — check starter format)

**Rationale:** Set up boundaries NOW so violations are caught as we write code, not discovered in Phase 10.

- [ ] **Step 1: Add eslint-plugin-boundaries configuration**

Add boundary element definitions and rules per the spec. See Task 25 for the full config. The rules enforce:
- puck-blocks can import: shared-ui, magic-ui, puck-shared, lightbox, hooks
- puck-blocks CANNOT import other puck-blocks
- Only puck-lib imports from `@puckeditor/core`
- App routes import from puck-lib, not `@puckeditor/core`

- [ ] **Step 2: Run lint to verify**

```bash
npm run lint
```

- [ ] **Step 3: Commit**

```bash
git add .eslintrc* eslint.config*
git commit -m "chore: add eslint-plugin-boundaries for architecture enforcement"
```

---

### Task 2c: next/image Remote Patterns (Early Setup)

**Files:**
- Modify: `next.config.js` (or `next.config.ts`)

**Rationale:** Needed before any block component renders Cloudinary or YouTube images.

- [ ] **Step 1: Add remote patterns**

```js
{
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "img.youtube.com" },
    ],
  },
}
```

- [ ] **Step 2: Commit**

```bash
git add next.config.*
git commit -m "chore: add Cloudinary and YouTube to next/image remote patterns"
```

---

## Phase 2: Schemas & Types

### Task 3: Shared Schema & Types

**Files:**
- Create: `src/components/puck/_shared/schema.ts`
- Create: `src/components/puck/_shared/video-utils.ts`
- Create: `src/types/puck.ts`
- Test: `src/components/puck/_shared/__tests__/schema.test.ts`
- Test: `src/components/puck/_shared/__tests__/video-utils.test.ts`

- [ ] **Step 1: Write failing test for MediaMetaSchema**

```ts
// src/components/puck/_shared/__tests__/schema.test.ts
import { describe, it, expect } from "vitest";
import { MediaMetaSchema } from "../schema";

describe("MediaMetaSchema", () => {
  it("accepts valid metadata", () => {
    const result = MediaMetaSchema.parse({
      caption: "Sunset photo",
      description: "Taken at the lake",
      tags: ["nature", "sunset"],
    });
    expect(result.caption).toBe("Sunset photo");
  });

  it("defaults tags to empty array", () => {
    const result = MediaMetaSchema.parse({});
    expect(result.tags).toEqual([]);
  });

  it("allows all fields to be optional", () => {
    const result = MediaMetaSchema.parse({});
    expect(result).toEqual({ tags: [] });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/components/puck/_shared/__tests__/schema.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement MediaMetaSchema**

```ts
// src/components/puck/_shared/schema.ts
import { z } from "zod";

export const MediaMetaSchema = z.object({
  caption: z.string().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).default([]),
});

export type MediaMeta = z.infer<typeof MediaMetaSchema>;
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/components/puck/_shared/__tests__/schema.test.ts
```

Expected: PASS

- [ ] **Step 5: Create shared video URL utilities**

These live in `_shared/` (not in VideoDetailBlock) so the lightbox can import them without violating ESLint boundaries.

```ts
// src/components/puck/_shared/video-utils.ts
export function extractYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
  return match?.[1] ?? null;
}

export function getVideoThumbnail(url: string, customThumbnail?: string): string {
  if (customThumbnail) return customThumbnail;
  const ytId = extractYouTubeId(url);
  if (ytId) return `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`;
  // Vimeo: TODO — call vimeo.com/api/oembed.json?url=... for thumbnail
  return "/placeholder-video.svg";
}
```

- [ ] **Step 6: Write test for video-utils**

```ts
// src/components/puck/_shared/__tests__/video-utils.test.ts
import { describe, it, expect } from "vitest";
import { extractYouTubeId, getVideoThumbnail } from "../video-utils";

describe("extractYouTubeId", () => {
  it("extracts ID from youtube.com/watch?v=", () => {
    expect(extractYouTubeId("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("extracts ID from youtu.be/", () => {
    expect(extractYouTubeId("https://youtu.be/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("returns null for non-YouTube URLs", () => {
    expect(extractYouTubeId("https://vimeo.com/123456")).toBeNull();
  });

  it("handles URLs with extra params", () => {
    expect(extractYouTubeId("https://www.youtube.com/watch?v=abc123&t=30")).toBe("abc123");
  });
});

describe("getVideoThumbnail", () => {
  it("returns custom thumbnail if provided", () => {
    expect(getVideoThumbnail("https://youtube.com/watch?v=abc", "custom.jpg")).toBe("custom.jpg");
  });

  it("returns YouTube thumbnail for YouTube URLs", () => {
    const thumb = getVideoThumbnail("https://www.youtube.com/watch?v=abc123");
    expect(thumb).toBe("https://img.youtube.com/vi/abc123/maxresdefault.jpg");
  });

  it("returns placeholder for Vimeo URLs", () => {
    expect(getVideoThumbnail("https://vimeo.com/123456")).toBe("/placeholder-video.svg");
  });
});
```

- [ ] **Step 7: Run video-utils tests**

```bash
npx vitest run src/components/puck/_shared/__tests__/video-utils.test.ts
```

Expected: PASS

- [ ] **Step 8: Create shared Puck types**

Re-export `Data` from here so no other file imports from `@puckeditor/core` directly.

```ts
// src/types/puck.ts
import type { Data as PuckData } from "@puckeditor/core";

export type PuckPageData = PuckData;

// Re-export Data so app routes and hooks import from here, not @puckeditor/core
export type { PuckData };

// Union of all media block prop types — extended in later tasks
export type { MediaMeta } from "@/components/puck/_shared/schema";
```

- [ ] **Step 9: Commit**

```bash
git add src/components/puck/_shared/ src/types/puck.ts
git commit -m "feat: add MediaMetaSchema, video-utils, and shared Puck types"
```

---

### Task 4: ImageDetailBlock Schema

**Files:**
- Create: `src/components/puck/ImageDetailBlock/schema.ts`
- Create: `src/components/puck/ImageDetailBlock/types.ts`
- Test: `src/components/puck/ImageDetailBlock/__tests__/schema.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// src/components/puck/ImageDetailBlock/__tests__/schema.test.ts
import { describe, it, expect } from "vitest";
import { ImageDetailSchema } from "../schema";

describe("ImageDetailSchema", () => {
  const validImage = {
    id: "550e8400-e29b-41d4-a716-446655440000",
    src: "https://res.cloudinary.com/test/image/upload/v1/photo.jpg",
    alt: "Sunset at the lake",
    width: 1920,
    height: 1080,
    cloudinaryPublicId: "v1/photo",
    hoverText: "Click to view",
    meta: { caption: "Sunset", tags: ["nature"] },
    projectId: null,
  };

  it("accepts valid image data", () => {
    const result = ImageDetailSchema.parse(validImage);
    expect(result.src).toBe(validImage.src);
  });

  it("requires src to be a URL", () => {
    expect(() =>
      ImageDetailSchema.parse({ ...validImage, src: "" })
    ).toThrow();
  });

  it("requires alt text", () => {
    expect(() =>
      ImageDetailSchema.parse({ ...validImage, alt: "" })
    ).toThrow();
  });

  it("defaults projectId to null", () => {
    const { projectId, ...withoutProject } = validImage;
    const result = ImageDetailSchema.parse(withoutProject);
    expect(result.projectId).toBeNull();
  });

  it("accepts a UUID projectId", () => {
    const result = ImageDetailSchema.parse({
      ...validImage,
      projectId: "660e8400-e29b-41d4-a716-446655440001",
    });
    expect(result.projectId).toBe("660e8400-e29b-41d4-a716-446655440001");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/components/puck/ImageDetailBlock/__tests__/schema.test.ts
```

Expected: FAIL

- [ ] **Step 3: Implement ImageDetailSchema**

```ts
// src/components/puck/ImageDetailBlock/schema.ts
import { z } from "zod";
import { MediaMetaSchema } from "@/components/puck/_shared/schema";

export const ImageDetailSchema = z.object({
  id: z.string().uuid(),
  src: z.string().url(),
  alt: z.string().min(1),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  cloudinaryPublicId: z.string().optional(),
  hoverText: z.string().optional(),
  meta: MediaMetaSchema,
  projectId: z.string().uuid().nullable().default(null),
});
```

```ts
// src/components/puck/ImageDetailBlock/types.ts
import { z } from "zod";
import { ImageDetailSchema } from "./schema";

export type ImageDetailProps = z.infer<typeof ImageDetailSchema>;
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/components/puck/ImageDetailBlock/__tests__/schema.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/puck/ImageDetailBlock/
git commit -m "feat: add ImageDetailBlock schema with Cloudinary + project association"
```

---

### Task 5: VideoDetailBlock Schema

**Files:**
- Create: `src/components/puck/VideoDetailBlock/schema.ts`
- Create: `src/components/puck/VideoDetailBlock/types.ts`
- Test: `src/components/puck/VideoDetailBlock/__tests__/schema.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// src/components/puck/VideoDetailBlock/__tests__/schema.test.ts
import { describe, it, expect } from "vitest";
import { VideoDetailSchema } from "../schema";

describe("VideoDetailSchema", () => {
  const validVideo = {
    id: "550e8400-e29b-41d4-a716-446655440000",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    title: "Project walkthrough",
    meta: {},
    projectId: null,
  };

  it("accepts YouTube URLs", () => {
    const result = VideoDetailSchema.parse(validVideo);
    expect(result.url).toBe(validVideo.url);
  });

  it("accepts Vimeo URLs", () => {
    const result = VideoDetailSchema.parse({
      ...validVideo,
      url: "https://vimeo.com/123456789",
    });
    expect(result.url).toContain("vimeo.com");
  });

  it("accepts youtu.be short URLs", () => {
    const result = VideoDetailSchema.parse({
      ...validVideo,
      url: "https://youtu.be/dQw4w9WgXcQ",
    });
    expect(result.url).toContain("youtu.be");
  });

  it("rejects non-YouTube/Vimeo URLs", () => {
    expect(() =>
      VideoDetailSchema.parse({
        ...validVideo,
        url: "https://example.com/video.mp4",
      })
    ).toThrow("Only YouTube and Vimeo URLs are supported");
  });

  it("requires title", () => {
    expect(() =>
      VideoDetailSchema.parse({ ...validVideo, title: "" })
    ).toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/components/puck/VideoDetailBlock/__tests__/schema.test.ts
```

Expected: FAIL

- [ ] **Step 3: Implement VideoDetailSchema**

```ts
// src/components/puck/VideoDetailBlock/schema.ts
import { z } from "zod";
import { MediaMetaSchema } from "@/components/puck/_shared/schema";

export const VideoDetailSchema = z.object({
  id: z.string().uuid(),
  url: z.string().url().refine(
    (url) => /(?:youtube\.com|youtu\.be|vimeo\.com)/.test(url),
    { message: "Only YouTube and Vimeo URLs are supported" }
  ),
  title: z.string().min(1),
  thumbnailSrc: z.string().optional(),
  hoverText: z.string().optional(),
  meta: MediaMetaSchema,
  projectId: z.string().uuid().nullable().default(null),
});
```

```ts
// src/components/puck/VideoDetailBlock/types.ts
import { z } from "zod";
import { VideoDetailSchema } from "./schema";

export type VideoDetailProps = z.infer<typeof VideoDetailSchema>;
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/components/puck/VideoDetailBlock/__tests__/schema.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/puck/VideoDetailBlock/
git commit -m "feat: add VideoDetailBlock schema with YouTube/Vimeo validation"
```

---

### Task 6: ProjectBlock Schema

**Files:**
- Create: `src/components/puck/ProjectBlock/schema.ts`
- Create: `src/components/puck/ProjectBlock/types.ts`
- Test: `src/components/puck/ProjectBlock/__tests__/schema.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// src/components/puck/ProjectBlock/__tests__/schema.test.ts
import { describe, it, expect } from "vitest";
import { ProjectBlockSchema } from "../schema";

describe("ProjectBlockSchema", () => {
  const validProject = {
    id: "550e8400-e29b-41d4-a716-446655440000",
    title: "My Photography Project",
    description: { type: "doc", content: [] },
    coverImage: "https://res.cloudinary.com/test/image/upload/cover.jpg",
    tags: ["photography", "nature"],
  };

  it("accepts valid project data", () => {
    const result = ProjectBlockSchema.parse(validProject);
    expect(result.title).toBe("My Photography Project");
  });

  it("accepts rich text description as record", () => {
    const result = ProjectBlockSchema.parse(validProject);
    expect(result.description).toEqual({ type: "doc", content: [] });
  });

  it("requires title", () => {
    expect(() =>
      ProjectBlockSchema.parse({ ...validProject, title: "" })
    ).toThrow();
  });

  it("defaults tags to empty array", () => {
    const { tags, ...withoutTags } = validProject;
    const result = ProjectBlockSchema.parse(withoutTags);
    expect(result.tags).toEqual([]);
  });

  it("accepts optional URLs", () => {
    const result = ProjectBlockSchema.parse({
      ...validProject,
      liveUrl: "https://example.com",
      repoUrl: "https://github.com/user/repo",
    });
    expect(result.liveUrl).toBe("https://example.com");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/components/puck/ProjectBlock/__tests__/schema.test.ts
```

Expected: FAIL

- [ ] **Step 3: Implement ProjectBlockSchema**

```ts
// src/components/puck/ProjectBlock/schema.ts
import { z } from "zod";

export const ProjectBlockSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  description: z.record(z.unknown()),
  coverImage: z.string().min(1),
  tags: z.array(z.string()).default([]),
  liveUrl: z.string().url().optional(),
  repoUrl: z.string().url().optional(),
});
```

```ts
// src/components/puck/ProjectBlock/types.ts
import { z } from "zod";
import { ProjectBlockSchema } from "./schema";

export type ProjectBlockProps = z.infer<typeof ProjectBlockSchema>;
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/components/puck/ProjectBlock/__tests__/schema.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/puck/ProjectBlock/
git commit -m "feat: add ProjectBlock schema with rich text description"
```

---

### Task 7: Page Validation Schemas

**Files:**
- Create: `src/validations/page.ts`
- Test: `src/validations/__tests__/page.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// src/validations/__tests__/page.test.ts
import { describe, it, expect } from "vitest";
import {
  PageRegistrySchema,
  PuckPageDataSchema,
  PageRegistryEntrySchema,
} from "../page";

describe("PageRegistryEntrySchema", () => {
  it("accepts valid entry", () => {
    const result = PageRegistryEntrySchema.parse({
      slug: "photography",
      title: "Photography",
      createdAt: "2026-03-18T12:00:00.000Z",
      lastModified: "2026-03-18T14:30:00.000Z",
    });
    expect(result.slug).toBe("photography");
  });

  it("requires slug", () => {
    expect(() =>
      PageRegistryEntrySchema.parse({ slug: "", title: "X", createdAt: "2026-03-18T12:00:00.000Z", lastModified: "2026-03-18T12:00:00.000Z" })
    ).toThrow();
  });
});

describe("PageRegistrySchema", () => {
  it("accepts empty pages array", () => {
    const result = PageRegistrySchema.parse({ pages: [] });
    expect(result.pages).toEqual([]);
  });
});

describe("PuckPageDataSchema", () => {
  it("accepts valid Puck data envelope", () => {
    const result = PuckPageDataSchema.parse({
      root: { props: { title: "My Page" } },
      content: [
        { type: "ImageDetailBlock", props: { id: "123" } },
      ],
    });
    expect(result.content).toHaveLength(1);
  });

  it("accepts empty content", () => {
    const result = PuckPageDataSchema.parse({
      root: { props: {} },
      content: [],
    });
    expect(result.content).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/validations/__tests__/page.test.ts
```

Expected: FAIL

- [ ] **Step 3: Implement page validation schemas**

```ts
// src/validations/page.ts
import { z } from "zod";

export const PageRegistryEntrySchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  createdAt: z.string().datetime(),
  lastModified: z.string().datetime(),
});

export const PageRegistrySchema = z.object({
  pages: z.array(PageRegistryEntrySchema),
});

export const PuckComponentSchema = z.object({
  type: z.string(),
  props: z.record(z.unknown()),
});

export const PuckPageDataSchema = z.object({
  root: z.object({ props: z.record(z.unknown()) }).passthrough(),
  content: z.array(PuckComponentSchema),
});

export type PageRegistryEntry = z.infer<typeof PageRegistryEntrySchema>;
export type PageRegistry = z.infer<typeof PageRegistrySchema>;
export type PuckPageData = z.infer<typeof PuckPageDataSchema>;
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/validations/__tests__/page.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/validations/
git commit -m "feat: add page registry and Puck data envelope schemas"
```

---

## Phase 3: Content Persistence Layer

### Task 8: File-Based Content Read/Write

**Files:**
- Create: `src/lib/content/pages.ts`
- Test: `src/lib/content/__tests__/pages.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// src/lib/content/__tests__/pages.test.ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs/promises";
import path from "path";
import {
  getPageData,
  savePageData,
  getRegistry,
  addPageToRegistry,
  removePageFromRegistry,
  CONTENT_DIR,
} from "../pages";

const TEST_CONTENT_DIR = path.join(process.cwd(), "content-test");

describe("Content persistence", () => {
  beforeEach(async () => {
    // Override CONTENT_DIR for tests
    await fs.mkdir(TEST_CONTENT_DIR, { recursive: true });
    await fs.writeFile(
      path.join(TEST_CONTENT_DIR, "_registry.json"),
      JSON.stringify({ pages: [] })
    );
  });

  afterEach(async () => {
    await fs.rm(TEST_CONTENT_DIR, { recursive: true, force: true });
  });

  it("getRegistry returns empty pages when registry exists", async () => {
    const registry = await getRegistry(TEST_CONTENT_DIR);
    expect(registry.pages).toEqual([]);
  });

  it("getRegistry auto-creates registry if missing", async () => {
    await fs.rm(path.join(TEST_CONTENT_DIR, "_registry.json"));
    const registry = await getRegistry(TEST_CONTENT_DIR);
    expect(registry.pages).toEqual([]);
  });

  it("addPageToRegistry creates entry with timestamps", async () => {
    await addPageToRegistry("photography", "Photography", TEST_CONTENT_DIR);
    const registry = await getRegistry(TEST_CONTENT_DIR);
    expect(registry.pages).toHaveLength(1);
    expect(registry.pages[0].slug).toBe("photography");
    expect(registry.pages[0].createdAt).toBeTruthy();
  });

  it("savePageData writes JSON and updates lastModified", async () => {
    await addPageToRegistry("photography", "Photography", TEST_CONTENT_DIR);
    const data = { root: { props: {} }, content: [] };
    await savePageData("photography", data, TEST_CONTENT_DIR);

    const loaded = await getPageData("photography", TEST_CONTENT_DIR);
    expect(loaded).toEqual(data);
  });

  it("getPageData returns null for missing page", async () => {
    const result = await getPageData("nonexistent", TEST_CONTENT_DIR);
    expect(result).toBeNull();
  });

  it("removePageFromRegistry deletes entry and file", async () => {
    await addPageToRegistry("photography", "Photography", TEST_CONTENT_DIR);
    await savePageData("photography", { root: { props: {} }, content: [] }, TEST_CONTENT_DIR);
    await removePageFromRegistry("photography", TEST_CONTENT_DIR);

    const registry = await getRegistry(TEST_CONTENT_DIR);
    expect(registry.pages).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/lib/content/__tests__/pages.test.ts
```

Expected: FAIL

- [ ] **Step 3: Implement content persistence**

```ts
// src/lib/content/pages.ts
import fs from "fs/promises";
import path from "path";
import { PageRegistrySchema, type PageRegistry } from "@/validations/page";

export const CONTENT_DIR = path.join(process.cwd(), "content");

export async function ensureContentDir(dir: string = CONTENT_DIR): Promise<void> {
  await fs.mkdir(dir, { recursive: true });
}

export async function getRegistry(dir: string = CONTENT_DIR): Promise<PageRegistry> {
  await ensureContentDir(dir);
  const registryPath = path.join(dir, "_registry.json");
  try {
    const raw = await fs.readFile(registryPath, "utf-8");
    return PageRegistrySchema.parse(JSON.parse(raw));
  } catch {
    const empty: PageRegistry = { pages: [] };
    await fs.writeFile(registryPath, JSON.stringify(empty, null, 2));
    return empty;
  }
}

async function saveRegistry(registry: PageRegistry, dir: string = CONTENT_DIR): Promise<void> {
  const registryPath = path.join(dir, "_registry.json");
  await fs.writeFile(registryPath, JSON.stringify(registry, null, 2));
}

export async function addPageToRegistry(
  slug: string,
  title: string,
  dir: string = CONTENT_DIR
): Promise<void> {
  const registry = await getRegistry(dir);
  const now = new Date().toISOString();
  registry.pages.push({ slug, title, createdAt: now, lastModified: now });
  await saveRegistry(registry, dir);
}

export async function removePageFromRegistry(
  slug: string,
  dir: string = CONTENT_DIR
): Promise<void> {
  const registry = await getRegistry(dir);
  registry.pages = registry.pages.filter((p) => p.slug !== slug);
  await saveRegistry(registry, dir);

  const filePath = path.join(dir, `${slug}.json`);
  try {
    await fs.unlink(filePath);
  } catch {
    // File may not exist — that's fine
  }
}

export async function getPageData(
  slug: string,
  dir: string = CONTENT_DIR
): Promise<Record<string, unknown> | null> {
  const filePath = path.join(dir, `${slug}.json`);
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function savePageData(
  slug: string,
  data: Record<string, unknown>,
  dir: string = CONTENT_DIR
): Promise<void> {
  await ensureContentDir(dir);
  const filePath = path.join(dir, `${slug}.json`);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));

  // Update lastModified in registry
  const registry = await getRegistry(dir);
  const entry = registry.pages.find((p) => p.slug === slug);
  if (entry) {
    entry.lastModified = new Date().toISOString();
    await saveRegistry(registry, dir);
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/lib/content/__tests__/pages.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/content/
git commit -m "feat: add file-based content persistence with registry"
```

---

### Task 9: API Routes for Page Data

**Files:**
- Create: `src/app/api/puck/route.ts`
- Create: `src/app/api/puck/pages/route.ts`

- [ ] **Step 1: Create per-component validation utility**

```ts
// src/lib/content/validate-components.ts
import { ImageDetailSchema } from "@/components/puck/ImageDetailBlock/schema";
import { VideoDetailSchema } from "@/components/puck/VideoDetailBlock/schema";
import { ProjectBlockSchema } from "@/components/puck/ProjectBlock/schema";
import type { z } from "zod";

const blockSchemas: Record<string, z.ZodSchema> = {
  ImageDetailBlock: ImageDetailSchema,
  VideoDetailBlock: VideoDetailSchema,
  ProjectBlock: ProjectBlockSchema,
};

type ComponentData = { type: string; props: Record<string, unknown> };

export function validateComponents(
  content: ComponentData[]
): { valid: true } | { valid: false; errors: Array<{ index: number; type: string; error: string }> } {
  const errors: Array<{ index: number; type: string; error: string }> = [];

  for (let i = 0; i < content.length; i++) {
    const item = content[i];
    const schema = blockSchemas[item.type];
    if (!schema) continue; // Unknown block types pass through

    const result = schema.safeParse(item.props);
    if (!result.success) {
      errors.push({ index: i, type: item.type, error: result.error.message });
    }
  }

  return errors.length > 0 ? { valid: false, errors } : { valid: true };
}
```

- [ ] **Step 2: Implement page data API route**

```ts
// src/app/api/puck/route.ts
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getPageData, savePageData, removePageFromRegistry } from "@/lib/content/pages";
import { PuckPageDataSchema } from "@/validations/page";
import { validateComponents } from "@/lib/content/validate-components";

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug");
  if (!slug) return NextResponse.json({ error: "slug required" }, { status: 400 });

  const data = await getPageData(slug);
  if (!data) return NextResponse.json({ error: "Page not found" }, { status: 404 });

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug");
  if (!slug) return NextResponse.json({ error: "slug required" }, { status: 400 });

  const body = await request.json();

  // Step 1: Validate Puck data envelope
  const parsed = PuckPageDataSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Step 2: Validate individual component props against their block schemas
  const componentValidation = validateComponents(parsed.data.content);
  if (!componentValidation.valid) {
    return NextResponse.json({ error: componentValidation.errors }, { status: 400 });
  }

  await savePageData(slug, parsed.data);
  revalidatePath(`/${slug}`);

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug");
  if (!slug) return NextResponse.json({ error: "slug required" }, { status: 400 });

  await removePageFromRegistry(slug);
  revalidatePath(`/${slug}`);

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: Implement page registry API route**

```ts
// src/app/api/puck/pages/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getRegistry, addPageToRegistry } from "@/lib/content/pages";

export async function GET() {
  const registry = await getRegistry();
  return NextResponse.json(registry);
}

export async function POST(request: NextRequest) {
  const { slug, title } = await request.json();

  if (!slug || !title) {
    return NextResponse.json({ error: "slug and title required" }, { status: 400 });
  }

  const registry = await getRegistry();
  if (registry.pages.some((p) => p.slug === slug)) {
    return NextResponse.json({ error: "Page already exists" }, { status: 409 });
  }

  await addPageToRegistry(slug, title);
  return NextResponse.json({ ok: true }, { status: 201 });
}
```

- [ ] **Step 3: Smoke test manually**

```bash
npm run dev
# In another terminal:
curl -X POST http://localhost:3000/api/puck/pages -H "Content-Type: application/json" -d '{"slug":"test","title":"Test Page"}'
curl http://localhost:3000/api/puck/pages
curl -X POST "http://localhost:3000/api/puck?slug=test" -H "Content-Type: application/json" -d '{"root":{"props":{}},"content":[]}'
curl "http://localhost:3000/api/puck?slug=test"
```

Expected: All return 200/201 with correct data. `content/test.json` and `content/_registry.json` are updated.

- [ ] **Step 4: Clean up test data and commit**

```bash
rm -f content/test.json
# Reset _registry.json to empty
echo '{"pages":[]}' > content/_registry.json
git add src/app/api/puck/
git commit -m "feat: add API routes for page data and registry CRUD"
```

---

## Phase 4: Puck Core Setup

### Task 10: Puck Config & Wrappers

**Files:**
- Create: `src/lib/puck/config.ts`
- Create: `src/lib/puck/editor.tsx`
- Create: `src/lib/puck/renderer.tsx`

- [ ] **Step 1: Create Puck config with placeholder blocks**

```tsx
// src/lib/puck/config.ts
import type { Config } from "@puckeditor/core";

// Placeholder render functions — replaced in Tasks 14-16
const PlaceholderBlock = ({ children }: { children: string }) => (
  <div className="p-4 border border-dashed rounded">{children}</div>
);

// IMPORTANT: defaultProps.id must NOT use crypto.randomUUID() at module level —
// that runs once at import time, so all instances would share the same ID.
// Instead, use Puck's resolveData or generate IDs in the component's
// resolveFields callback. During implementation, verify the Puck 0.21+ API
// for per-instance ID generation. Fallback: use an onDrop handler to assign IDs.

export const puckConfig: Config = {
  components: {
    ImageDetailBlock: {
      fields: {
        id: { type: "text", label: "ID" },
      },
      resolveData: ({ props }) => ({
        props: { ...props, id: props.id || crypto.randomUUID() },
      }),
      render: () => <PlaceholderBlock>Image Detail (placeholder)</PlaceholderBlock>,
    },
    VideoDetailBlock: {
      fields: {
        id: { type: "text", label: "ID" },
      },
      resolveData: ({ props }) => ({
        props: { ...props, id: props.id || crypto.randomUUID() },
      }),
      render: () => <PlaceholderBlock>Video Detail (placeholder)</PlaceholderBlock>,
    },
    ProjectBlock: {
      fields: {
        id: { type: "text", label: "ID" },
      },
      resolveData: ({ props }) => ({
        props: { ...props, id: props.id || crypto.randomUUID() },
      }),
      render: () => <PlaceholderBlock>Project (placeholder)</PlaceholderBlock>,
    },
  },
};
```

- [ ] **Step 2: Create editor wrapper**

```tsx
// src/lib/puck/editor.tsx
"use client";

import { Puck } from "@puckeditor/core";
import "@puckeditor/core/puck.css";
import { puckConfig } from "./config";

import type { Data } from "@puckeditor/core";

type PuckEditorProps = {
  data: Data;
  onPublish: (data: Data) => Promise<void>;
};

export function PuckEditor({ data, onPublish }: PuckEditorProps) {
  return <Puck config={puckConfig} data={data} onPublish={onPublish} />;
}
```

- [ ] **Step 3: Create renderer wrapper**

```tsx
// src/lib/puck/renderer.tsx
import { Render } from "@puckeditor/core";
import { puckConfig } from "./config";
import type { Data } from "@puckeditor/core";

type PuckRendererProps = {
  data: Data;
};

export function PuckRenderer({ data }: PuckRendererProps) {
  return <Render config={puckConfig} data={data} />;
}
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/puck/
git commit -m "feat: add Puck config with placeholder blocks and editor/renderer wrappers"
```

---

### Task 11: Cloudinary Image Custom Field

**Files:**
- Create: `src/lib/puck/fields/cloudinary-image.tsx`

- [ ] **Step 1: Implement CloudinaryImageField**

```tsx
// src/lib/puck/fields/cloudinary-image.tsx
"use client";

import { FieldLabel } from "@puckeditor/core";

declare global {
  interface Window {
    cloudinary?: {
      createUploadWidget: (
        options: Record<string, unknown>,
        callback: (error: unknown, result: { event: string; info: Record<string, unknown> }) => void
      ) => { open: () => void };
    };
  }
}

type CloudinaryImageValue = {
  src: string;
  width?: number;
  height?: number;
  cloudinaryPublicId?: string;
} | null;

type CloudinaryImageFieldProps = {
  value: CloudinaryImageValue;
  onChange: (value: CloudinaryImageValue) => void;
  field: { label?: string };
};

export function CloudinaryImageField({ value, onChange, field }: CloudinaryImageFieldProps) {
  const openWidget = () => {
    if (!window.cloudinary) {
      console.error("Cloudinary widget script not loaded");
      return;
    }

    const widget = window.cloudinary.createUploadWidget(
      {
        cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
        uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
        sources: ["local", "url", "camera", "google_drive"],
        multiple: false,
        maxFileSize: 10_000_000,
        resourceType: "image",
      },
      (error, result) => {
        if (!error && result?.event === "success") {
          onChange({
            src: result.info.secure_url as string,
            width: result.info.width as number,
            height: result.info.height as number,
            cloudinaryPublicId: result.info.public_id as string,
          });
        }
      }
    );
    widget.open();
  };

  return (
    <FieldLabel label={field.label || "Image"}>
      <div className="flex flex-col gap-2">
        {value?.src && (
          <img
            src={value.src}
            alt="Preview"
            className="h-20 w-full rounded object-cover"
          />
        )}
        <button
          type="button"
          onClick={openWidget}
          className="rounded bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700"
        >
          {value?.src ? "Change Image" : "Upload Image"}
        </button>
        {value?.src && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="rounded border px-3 py-1 text-sm text-red-600 hover:bg-red-50"
          >
            Remove
          </button>
        )}
      </div>
    </FieldLabel>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/puck/fields/cloudinary-image.tsx
git commit -m "feat: add Cloudinary upload widget custom Puck field"
```

---

### Task 12: Project Select Custom Field

**Files:**
- Create: `src/lib/puck/fields/project-select.tsx`

- [ ] **Step 1: Implement ProjectSelectField**

```tsx
// src/lib/puck/fields/project-select.tsx
"use client";

import { createUsePuck, FieldLabel } from "@puckeditor/core";

const usePuck = createUsePuck();

type ProjectSelectFieldProps = {
  value: string | null;
  onChange: (value: string | null) => void;
  field: { label?: string };
};

export function ProjectSelectField({ value, onChange, field }: ProjectSelectFieldProps) {
  const projects = usePuck((state) => {
    const content = state.appState?.data?.content ?? [];
    return content
      .filter((item) => item.type === "ProjectBlock")
      .map((item) => ({
        id: item.props?.id as string,
        title: (item.props?.title as string) || "Untitled Project",
      }));
  });

  return (
    <FieldLabel label={field.label || "Project"}>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || null)}
        className="w-full rounded border px-2 py-1.5 text-sm"
      >
        <option value="">None</option>
        {projects.map((project) => (
          <option key={project.id} value={project.id}>
            {project.title}
          </option>
        ))}
      </select>
    </FieldLabel>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/puck/fields/project-select.tsx
git commit -m "feat: add project-select custom Puck field using usePuck"
```

---

## Phase 5: Editor & Published Page Routes

### Task 13: Root Layout with Cloudinary Script & NuqsAdapter

**Files:**
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Read current layout.tsx**

Check what the starter's layout.tsx looks like so we know what to keep vs. replace.

- [ ] **Step 2: Update layout.tsx**

Add the Cloudinary script tag, `NuqsAdapter`, and preserve existing providers (theme, etc.):

```tsx
// src/app/layout.tsx
import type { Metadata } from "next";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import Script from "next/script";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "Portfolio",
  description: "My portfolio",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <NuqsAdapter>
          {children}
        </NuqsAdapter>
        <Script
          src="https://widget.cloudinary.com/v2.0/global/all.js"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}
```

Preserve any existing theme providers from the starter as needed.

- [ ] **Step 3: Verify dev server starts**

```bash
npm run dev
```

Expected: No errors, page loads.

- [ ] **Step 4: Commit**

```bash
git add src/app/layout.tsx
git commit -m "feat: add NuqsAdapter and Cloudinary script to root layout"
```

---

### Task 14: Editor Page Route

**Files:**
- Create: `src/app/edit/[...slug]/page.tsx` (server component)
- Create: `src/app/edit/[...slug]/editor-client.tsx` (client component)

- [ ] **Step 1: Create client component**

```tsx
// src/app/edit/[...slug]/editor-client.tsx
"use client";

import { useRouter } from "next/navigation";
import { PuckEditor } from "@/lib/puck/editor";
import type { PuckPageData } from "@/types/puck";

type EditorClientProps = {
  slug: string;
  initialData: PuckPageData;
};

export function EditorClient({ slug, initialData }: EditorClientProps) {
  const router = useRouter();

  const handlePublish = async (data: PuckPageData) => {
    const res = await fetch(`/api/puck?slug=${encodeURIComponent(slug)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json();
      alert(`Save failed: ${JSON.stringify(err.error)}`);
      return;
    }

    router.push(`/${slug}`);
  };

  return <PuckEditor data={initialData} onPublish={handlePublish} />;
}
```

- [ ] **Step 2: Create server component**

```tsx
// src/app/edit/[...slug]/page.tsx
import { getPageData } from "@/lib/content/pages";
import { EditorClient } from "./editor-client";
import type { PuckPageData } from "@/types/puck";

type EditorPageProps = {
  params: Promise<{ slug: string[] }>;
};

const emptyData: PuckPageData = {
  root: { props: {} },
  content: [],
  zones: {},
};

export default async function EditorPage({ params }: EditorPageProps) {
  const { slug } = await params;
  const slugStr = slug.join("/");

  const data = await getPageData(slugStr);

  return (
    <EditorClient
      slug={slugStr}
      initialData={(data as PuckPageData) ?? emptyData}
    />
  );
}
```

**Note:** Both files import types from `@/types/puck` — never from `@puckeditor/core` directly.

- [ ] **Step 2: Test manually**

```bash
npm run dev
# Visit http://localhost:3000/edit/test-page
```

Expected: Puck editor loads with the three placeholder blocks in the drawer.

- [ ] **Step 3: Commit**

```bash
git add src/app/edit/
git commit -m "feat: add editor page route with Puck integration"
```

---

### Task 15: Published Page Route with ISR

**Files:**
- Create: `src/app/(site)/[[...slug]]/page.tsx`
- Create: `src/hooks/use-page-data.tsx` (PageDataProvider context)

- [ ] **Step 1: Create PageDataProvider**

```tsx
// src/hooks/use-page-data.tsx
"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { PuckPageData as Data } from "@/types/puck";

const PageDataContext = createContext<Data | null>(null);

export function PageDataProvider({
  data,
  children,
}: {
  data: Data;
  children: ReactNode;
}) {
  return <PageDataContext.Provider value={data}>{children}</PageDataContext.Provider>;
}

export function usePageData(): Data {
  const data = useContext(PageDataContext);
  if (!data) throw new Error("usePageData must be used within PageDataProvider");
  return data;
}
```

- [ ] **Step 2: Create published page route**

```tsx
// src/app/(site)/[[...slug]]/page.tsx
import { getPageData, getRegistry } from "@/lib/content/pages";
import { PuckRenderer } from "@/lib/puck/renderer";
import { PageDataProvider } from "@/hooks/use-page-data";
import { notFound } from "next/navigation";
import type { PuckPageData as Data } from "@/types/puck";

export const dynamic = "force-static";
export const dynamicParams = true;

export async function generateStaticParams() {
  const registry = await getRegistry();
  return registry.pages.map((page) => ({
    slug: page.slug.split("/"),
  }));
}

type PageProps = {
  params: Promise<{ slug?: string[] }>;
};

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  const slugStr = slug?.join("/") ?? "home";

  const data = await getPageData(slugStr);
  if (!data) notFound();

  return (
    <PageDataProvider data={data as Data}>
      <PuckRenderer data={data as Data} />
    </PageDataProvider>
  );
}
```

- [ ] **Step 3: Test by creating and publishing a page**

```bash
npm run dev
# 1. Visit /edit/photography — add a block, hit Publish
# 2. Visit /photography — should show the published content
```

- [ ] **Step 4: Commit**

```bash
git add src/app/"(site)"/ src/hooks/use-page-data.tsx
git commit -m "feat: add published page route with ISR and PageDataProvider"
```

---

## Phase 6: Puck Block Components

### Task 16: ImageDetailBlock Component

**Files:**
- Modify: `src/components/puck/ImageDetailBlock/index.tsx` (create)
- Modify: `src/lib/puck/config.ts` (update component registration)

- [ ] **Step 1: Implement ImageDetailBlock render component**

```tsx
// src/components/puck/ImageDetailBlock/index.tsx
"use client";

import Image from "next/image";
import type { ImageDetailProps } from "./types";

export function ImageDetailBlock(props: ImageDetailProps) {
  const { src, alt, width, height, hoverText, cloudinaryPublicId } = props;

  // Use Cloudinary transformations for optimized delivery
  const optimizedSrc = cloudinaryPublicId
    ? src.replace("/upload/", "/upload/w_800,c_limit,f_auto,q_auto/")
    : src;

  return (
    <div className="group relative cursor-pointer overflow-hidden rounded-lg">
      <Image
        src={optimizedSrc}
        alt={alt}
        width={width ?? 800}
        height={height ?? 600}
        className="h-auto w-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
      {hoverText && (
        <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/60 to-transparent p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <p className="text-sm text-white">{hoverText}</p>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Update Puck config for ImageDetailBlock**

Update `src/lib/puck/config.ts` to replace the placeholder with the real component, full field definitions, and the `CloudinaryImageField` custom field. Register all fields from the spec: image (cloudinary-image), alt, hoverText, caption, description, tags, projectId (project-select).

- [ ] **Step 3: Test in editor**

```bash
npm run dev
# Visit /edit/test — drag ImageDetailBlock, upload an image via Cloudinary, verify preview
```

- [ ] **Step 4: Commit**

```bash
git add src/components/puck/ImageDetailBlock/index.tsx src/lib/puck/config.ts
git commit -m "feat: implement ImageDetailBlock with Cloudinary + hover overlay"
```

---

### Task 17: VideoDetailBlock Component

**Files:**
- Create: `src/components/puck/VideoDetailBlock/index.tsx`
- Modify: `src/lib/puck/config.ts`

- [ ] **Step 1: Implement VideoDetailBlock render component**

Note: `extractYouTubeId` and `getVideoThumbnail` were already created in `_shared/video-utils.ts` (Task 3). Import from there.

```tsx
// src/components/puck/VideoDetailBlock/index.tsx
"use client";

import Image from "next/image";
import type { VideoDetailProps } from "./types";
import { getVideoThumbnail } from "@/components/puck/_shared/video-utils";

export function VideoDetailBlock(props: VideoDetailProps) {
  const { url, title, thumbnailSrc, hoverText } = props;
  const thumbnail = getVideoThumbnail(url, thumbnailSrc);

  return (
    <div className="group relative cursor-pointer overflow-hidden rounded-lg">
      <Image
        src={thumbnail}
        alt={title}
        width={800}
        height={450}
        className="h-auto w-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="rounded-full bg-black/60 p-3">
          <svg className="h-8 w-8 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>
      {hoverText && (
        <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/60 to-transparent p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <p className="text-sm text-white">{hoverText}</p>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Update Puck config for VideoDetailBlock**

Replace placeholder in `config.ts` with real component and fields.

- [ ] **Step 4: Test in editor**

```bash
npm run dev
# Drag VideoDetailBlock, paste a YouTube URL, verify thumbnail auto-extraction
```

- [ ] **Step 5: Commit**

```bash
git add src/components/puck/VideoDetailBlock/ src/lib/puck/config.ts
git commit -m "feat: implement VideoDetailBlock with auto thumbnail extraction"
```

---

### Task 18: ProjectBlock Component

**Files:**
- Create: `src/components/puck/ProjectBlock/index.tsx`
- Modify: `src/lib/puck/config.ts`

- [ ] **Step 1: Implement ProjectBlock render component**

```tsx
// src/components/puck/ProjectBlock/index.tsx
"use client";

import Image from "next/image";
import type { ProjectBlockProps } from "./types";

export function ProjectBlock(props: ProjectBlockProps) {
  const { title, coverImage, tags } = props;

  return (
    <div className="group cursor-pointer overflow-hidden rounded-lg border bg-card shadow-sm transition-shadow hover:shadow-md">
      <div className="relative aspect-video overflow-hidden">
        <Image
          src={coverImage}
          alt={title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        {tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Update Puck config for ProjectBlock**

Replace placeholder with real component. Register fields including RichText for description and cloudinary-image for cover.

- [ ] **Step 3: Test in editor**

```bash
npm run dev
# Drag ProjectBlock, fill in title + cover image, verify card rendering
```

- [ ] **Step 4: Commit**

```bash
git add src/components/puck/ProjectBlock/index.tsx src/lib/puck/config.ts
git commit -m "feat: implement ProjectBlock with cover image and tags"
```

---

## Phase 7: Lightbox System

### Task 19: useProjectMedia Hook

**Files:**
- Create: `src/hooks/use-project-media.ts`
- Test: `src/hooks/__tests__/use-project-media.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// src/hooks/__tests__/use-project-media.test.ts
import { describe, it, expect } from "vitest";
import { resolveProjectMedia } from "../use-project-media";

describe("resolveProjectMedia", () => {
  const pageData = {
    root: { props: {} },
    content: [
      { type: "ProjectBlock", props: { id: "proj-1", title: "My Project" } },
      { type: "ImageDetailBlock", props: { id: "img-1", src: "https://example.com/a.jpg", projectId: "proj-1", meta: {} } },
      { type: "ImageDetailBlock", props: { id: "img-2", src: "https://example.com/b.jpg", projectId: "proj-1", meta: {} } },
      { type: "VideoDetailBlock", props: { id: "vid-1", url: "https://youtube.com/watch?v=abc", projectId: "proj-1", meta: {} } },
      { type: "ImageDetailBlock", props: { id: "img-3", src: "https://example.com/c.jpg", projectId: null, meta: {} } },
    ],
  };

  it("returns media associated with a project", () => {
    const media = resolveProjectMedia("proj-1", pageData);
    expect(media).toHaveLength(3);
  });

  it("returns empty array for unknown project", () => {
    const media = resolveProjectMedia("unknown", pageData);
    expect(media).toEqual([]);
  });

  it("excludes unlinked media", () => {
    const media = resolveProjectMedia("proj-1", pageData);
    const ids = media.map((m) => m.props.id);
    expect(ids).not.toContain("img-3");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/hooks/__tests__/use-project-media.test.ts
```

Expected: FAIL

- [ ] **Step 3: Implement**

```ts
// src/hooks/use-project-media.ts
"use client";

import { usePageData } from "./use-page-data";

type ContentItem = {
  type: string;
  props: Record<string, unknown>;
};

type PageData = {
  content: ContentItem[];
  [key: string]: unknown;
};

// Pure function for testing
export function resolveProjectMedia(
  projectId: string,
  pageData: PageData
): ContentItem[] {
  return pageData.content.filter(
    (item) =>
      (item.type === "ImageDetailBlock" || item.type === "VideoDetailBlock") &&
      item.props.projectId === projectId
  );
}

// Hook for use in components
export function useProjectMedia(projectId: string | null) {
  const pageData = usePageData();
  if (!projectId) return [];
  return resolveProjectMedia(projectId, pageData as unknown as PageData);
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/hooks/__tests__/use-project-media.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/hooks/use-project-media.ts src/hooks/__tests__/
git commit -m "feat: add useProjectMedia hook with pure resolveProjectMedia function"
```

---

### Task 20: LightboxProvider & LightboxGallery

**Files:**
- Create: `src/components/lightbox/LightboxProvider.tsx`
- Create: `src/components/lightbox/LightboxGallery.tsx`
- Create: `src/components/lightbox/slides/ImageSlide.tsx`
- Create: `src/components/lightbox/slides/VideoSlide.tsx`
- Create: `src/components/lightbox/MetaOverlay.tsx`

- [ ] **Step 1: Create LightboxProvider**

```tsx
// src/components/lightbox/LightboxProvider.tsx
"use client";

import { useQueryState } from "nuqs";
import { usePageData } from "@/hooks/use-page-data";
import { resolveProjectMedia } from "@/hooks/use-project-media";
import { LightboxGallery } from "./LightboxGallery";

export function LightboxProvider() {
  const [mediaId, setMediaId] = useQueryState("media");
  const [projectId, setProjectId] = useQueryState("project");
  const pageData = usePageData();

  const content = (pageData as { content: Array<{ type: string; props: Record<string, unknown> }> }).content;

  // Determine what to show
  if (projectId) {
    const projectBlock = content.find(
      (item) => item.type === "ProjectBlock" && item.props.id === projectId
    );
    const associatedMedia = resolveProjectMedia(projectId, pageData as { content: typeof content });

    if (!projectBlock) return null;

    return (
      <LightboxGallery
        project={projectBlock.props}
        media={associatedMedia.map((m) => m.props)}
        onClose={() => setProjectId(null)}
      />
    );
  }

  if (mediaId) {
    const mediaBlock = content.find(
      (item) =>
        (item.type === "ImageDetailBlock" || item.type === "VideoDetailBlock") &&
        item.props.id === mediaId
    );

    if (!mediaBlock) return null;

    return (
      <LightboxGallery
        media={[mediaBlock.props]}
        onClose={() => setMediaId(null)}
      />
    );
  }

  return null;
}
```

- [ ] **Step 2: Create LightboxGallery**

```tsx
// src/components/lightbox/LightboxGallery.tsx
"use client";

import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import { ImageSlide } from "./slides/ImageSlide";
import { VideoSlide } from "./slides/VideoSlide";
import { MetaOverlay } from "./MetaOverlay";

type LightboxGalleryProps = {
  project?: Record<string, unknown>;
  media: Array<Record<string, unknown>>;
  onClose: () => void;
};

export function LightboxGallery({ project, media, onClose }: LightboxGalleryProps) {
  const slides = media.map((item) => ({
    type: item.url ? "video" : "image",
    ...item,
  }));

  return (
    <Lightbox
      open
      close={onClose}
      slides={slides.map((slide) => ({
        src: (slide.src as string) ?? "",
        // yet-another-react-lightbox expects src for images
      }))}
      render={{
        slide: ({ slide, offset }) => {
          const currentSlide = slides[offset] ?? slides[0];
          if (!currentSlide) return null;

          if (currentSlide.type === "video") {
            return <VideoSlide url={currentSlide.url as string} title={currentSlide.title as string} />;
          }
          return (
            <ImageSlide
              src={currentSlide.src as string}
              alt={(currentSlide.alt as string) ?? ""}
              cloudinaryPublicId={currentSlide.cloudinaryPublicId as string | undefined}
            />
          );
        },
      }}
    />
  );
}
```

**IMPORTANT:** The `render.slide` callback API above is illustrative — the exact `yet-another-react-lightbox` render API MUST be verified against the library docs during implementation. The `offset` parameter likely does not exist; use the library's actual slide index mechanism. Use context7 to fetch the latest API docs before implementing.

- [ ] **Step 3: Create ImageSlide**

```tsx
// src/components/lightbox/slides/ImageSlide.tsx
import Image from "next/image";

type ImageSlideProps = {
  src: string;
  alt: string;
  cloudinaryPublicId?: string;
};

export function ImageSlide({ src, alt, cloudinaryPublicId }: ImageSlideProps) {
  const fullSrc = cloudinaryPublicId
    ? src.replace("/upload/", "/upload/w_1600,c_limit,f_auto,q_auto/")
    : src;

  return (
    <div className="flex h-full w-full items-center justify-center">
      <Image
        src={fullSrc}
        alt={alt}
        width={1600}
        height={1200}
        className="max-h-[90vh] w-auto object-contain"
      />
    </div>
  );
}
```

- [ ] **Step 4: Create VideoSlide**

```tsx
// src/components/lightbox/slides/VideoSlide.tsx
// Import from _shared (NOT from VideoDetailBlock — that would violate ESLint boundaries)
import { extractYouTubeId } from "@/components/puck/_shared/video-utils";

type VideoSlideProps = {
  url: string;
  title: string;
};

export function VideoSlide({ url, title }: VideoSlideProps) {
  const ytId = extractYouTubeId(url);
  const isVimeo = url.includes("vimeo.com");
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);

  let embedUrl = "";
  if (ytId) {
    embedUrl = `https://www.youtube.com/embed/${ytId}?autoplay=1`;
  } else if (isVimeo && vimeoMatch) {
    embedUrl = `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`;
  }

  return (
    <div className="flex h-full w-full items-center justify-center">
      <iframe
        src={embedUrl}
        title={title}
        width="960"
        height="540"
        className="max-h-[80vh] max-w-full"
        allow="autoplay; fullscreen"
        allowFullScreen
      />
    </div>
  );
}
```

- [ ] **Step 5: Create MetaOverlay (placeholder — enhance with Magic UI later)**

```tsx
// src/components/lightbox/MetaOverlay.tsx
type MetaOverlayProps = {
  caption?: string;
  description?: string;
  tags?: string[];
};

export function MetaOverlay({ caption, description, tags }: MetaOverlayProps) {
  if (!caption && !description && (!tags || tags.length === 0)) return null;

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
      {caption && <h3 className="text-lg font-semibold text-white">{caption}</h3>}
      {description && <p className="mt-1 text-sm text-white/80">{description}</p>}
      {tags && tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {tags.map((tag) => (
            <span key={tag} className="rounded-full bg-white/20 px-2 py-0.5 text-xs text-white">
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add src/components/lightbox/
git commit -m "feat: add URL-driven lightbox system with image and video slides"
```

---

### Task 21: Wire Lightbox into Published Pages & Block Click Handlers

**Files:**
- Modify: `src/app/(site)/[[...slug]]/page.tsx`
- Modify: `src/components/puck/ImageDetailBlock/index.tsx`
- Modify: `src/components/puck/VideoDetailBlock/index.tsx`
- Modify: `src/components/puck/ProjectBlock/index.tsx`

- [ ] **Step 1: Add LightboxProvider to published page**

Add `<LightboxProvider />` inside `<PageDataProvider>` in the published page route.

- [ ] **Step 2: Add click handlers to blocks**

Each block needs to update the URL via `nuqs` on click:
- ImageDetailBlock & VideoDetailBlock: set `?media={id}`
- ProjectBlock: set `?project={id}`

Use the `useQueryState` hook from `nuqs` in each block's render component.

- [ ] **Step 3: Test end-to-end**

```bash
npm run dev
# 1. Create a page at /edit/test with an ImageDetailBlock and a ProjectBlock
# 2. Associate the image with the project
# 3. Publish
# 4. Visit /test — click the image, verify lightbox opens
# 5. Click the project card, verify lightbox opens with associated images
# 6. Verify browser back closes lightbox
# 7. Verify deep-link: /test?media=<uuid> opens the lightbox directly
```

- [ ] **Step 4: Commit**

```bash
git add src/app/"(site)"/ src/components/puck/
git commit -m "feat: wire lightbox to block click handlers with URL-driven state"
```

---

## Phase 8: Page Manager

### Task 22: PageManager Component

**Files:**
- Create: `src/components/puck/PageManager/index.tsx`
- Create: `src/components/puck/PageManager/types.ts`
- Modify: `src/app/edit/[...slug]/page.tsx`

- [ ] **Step 1: Create PageManager types**

```ts
// src/components/puck/PageManager/types.ts
export type PageEntry = {
  slug: string;
  title: string;
  createdAt: string;
  lastModified: string;
};
```

- [ ] **Step 2: Implement PageManager**

```tsx
// src/components/puck/PageManager/index.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { PageEntry } from "./types";

export function PageManager({ currentSlug }: { currentSlug: string }) {
  const router = useRouter();
  const [pages, setPages] = useState<PageEntry[]>([]);
  const [showNewPage, setShowNewPage] = useState(false);
  const [newSlug, setNewSlug] = useState("");
  const [newTitle, setNewTitle] = useState("");

  useEffect(() => {
    fetch("/api/puck/pages")
      .then((res) => res.json())
      .then((data) => setPages(data.pages ?? []));
  }, []);

  const createPage = async () => {
    if (!newSlug || !newTitle) return;
    const res = await fetch("/api/puck/pages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: newSlug, title: newTitle }),
    });
    if (res.ok) {
      setShowNewPage(false);
      setNewSlug("");
      setNewTitle("");
      router.push(`/edit/${newSlug}`);
    }
  };

  const deletePage = async (slug: string) => {
    if (!confirm(`Delete "${slug}"? This cannot be undone.`)) return;
    await fetch(`/api/puck?slug=${slug}`, { method: "DELETE" });
    setPages((prev) => prev.filter((p) => p.slug !== slug));
    if (slug === currentSlug) router.push("/edit/home");
  };

  return (
    <div className="flex items-center gap-2 border-b bg-muted/30 px-4 py-2 text-sm">
      <span className="font-medium">Pages:</span>
      {pages
        .sort((a, b) => b.lastModified.localeCompare(a.lastModified))
        .map((page) => (
          <div key={page.slug} className="flex items-center gap-1">
            <button
              onClick={() => router.push(`/edit/${page.slug}`)}
              className={`rounded px-2 py-1 ${
                page.slug === currentSlug ? "bg-primary text-primary-foreground" : "hover:bg-muted"
              }`}
            >
              {page.title}
            </button>
            <button
              onClick={() => deletePage(page.slug)}
              className="text-xs text-red-500 hover:text-red-700"
            >
              x
            </button>
          </div>
        ))}
      {showNewPage ? (
        <div className="flex items-center gap-1">
          <input
            value={newSlug}
            onChange={(e) => setNewSlug(e.target.value)}
            placeholder="slug"
            className="w-24 rounded border px-2 py-1 text-xs"
          />
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Title"
            className="w-24 rounded border px-2 py-1 text-xs"
          />
          <button onClick={createPage} className="text-xs text-green-600">
            Create
          </button>
          <button onClick={() => setShowNewPage(false)} className="text-xs text-gray-500">
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowNewPage(true)}
          className="rounded border px-2 py-1 text-xs hover:bg-muted"
        >
          + New Page
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Add PageManager to editor layout**

Modify `src/app/edit/[...slug]/page.tsx` to render `<PageManager>` above the Puck editor.

- [ ] **Step 4: Test**

```bash
npm run dev
# Visit /edit/home — verify page list, create new page, switch between pages, delete
```

- [ ] **Step 5: Commit**

```bash
git add src/components/puck/PageManager/ src/app/edit/
git commit -m "feat: add PageManager for page CRUD in editor UI"
```

---

## Phase 9: Project Linker Plugin

### Task 23: Project Linker Plugin

**Files:**
- Create: `src/lib/puck/plugins/project-linker.tsx`
- Modify: `src/lib/puck/editor.tsx`

- [ ] **Step 1: Implement Project Linker plugin**

```tsx
// src/lib/puck/plugins/project-linker.tsx
"use client";

import { createUsePuck } from "@puckeditor/core";
import { FolderOpen, Image, Play, CircleSlash } from "lucide-react";
import type { Plugin } from "@puckeditor/core";

const usePuck = createUsePuck();

function ProjectLinkerPanel() {
  const { projects, images, videos } = usePuck((state) => {
    const content = state.appState?.data?.content ?? [];
    return {
      projects: content.filter((item) => item.type === "ProjectBlock"),
      images: content.filter((item) => item.type === "ImageDetailBlock"),
      videos: content.filter((item) => item.type === "VideoDetailBlock"),
    };
  });

  const allMedia = [...images, ...videos];
  const grouped = new Map<string, typeof allMedia>();
  const unlinked: typeof allMedia = [];

  for (const item of allMedia) {
    const pid = item.props?.projectId as string | null;
    if (pid) {
      if (!grouped.has(pid)) grouped.set(pid, []);
      grouped.get(pid)!.push(item);
    } else {
      unlinked.push(item);
    }
  }

  return (
    <div className="p-3 text-sm">
      {projects.map((project) => (
        <div key={project.props?.id as string} className="mb-3">
          <div className="flex items-center gap-1 font-medium">
            <FolderOpen className="h-4 w-4" />
            {(project.props?.title as string) || "Untitled"}
          </div>
          <div className="ml-5 mt-1 space-y-0.5">
            {(grouped.get(project.props?.id as string) ?? []).map((item) => (
              <div key={item.props?.id as string} className="flex items-center gap-1 text-muted-foreground">
                {item.type === "ImageDetailBlock" ? <Image className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                {(item.props?.alt as string) || (item.props?.title as string) || "Untitled"}
              </div>
            ))}
            {!(grouped.get(project.props?.id as string) ?? []).length && (
              <span className="text-xs text-muted-foreground/50">No linked media</span>
            )}
          </div>
        </div>
      ))}

      {unlinked.length > 0 && (
        <div className="mt-3 border-t pt-3">
          <div className="flex items-center gap-1 font-medium text-muted-foreground">
            <CircleSlash className="h-4 w-4" />
            Unlinked
          </div>
          <div className="ml-5 mt-1 space-y-0.5">
            {unlinked.map((item) => (
              <div key={item.props?.id as string} className="flex items-center gap-1 text-muted-foreground">
                {item.type === "ImageDetailBlock" ? <Image className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                {(item.props?.alt as string) || (item.props?.title as string) || "Untitled"}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export const projectLinkerPlugin: Plugin = {
  name: "project-linker",
  label: "Project Links",
  icon: <FolderOpen className="h-4 w-4" />,
  render: ProjectLinkerPanel,
};
```

- [ ] **Step 2: Register plugin in editor wrapper**

Update `src/lib/puck/editor.tsx` to pass `plugins={[projectLinkerPlugin]}` to the `<Puck>` component.

- [ ] **Step 3: Test**

```bash
npm run dev
# Visit /edit/test — verify Project Links panel in plugin rail
# Add projects and media, link them, verify tree view updates
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/puck/plugins/project-linker.tsx src/lib/puck/editor.tsx
git commit -m "feat: add Project Linker plugin rail panel"
```

---

## Phase 10: Production Hardening

### Task 24: Middleware for Editor Route Protection

**Files:**
- Create: `src/middleware.ts`

- [ ] **Step 1: Implement middleware**

```ts
// src/middleware.ts
import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    if (request.nextUrl.pathname.startsWith("/edit")) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/edit/:path*"],
};
```

- [ ] **Step 2: Commit**

```bash
git add src/middleware.ts
git commit -m "feat: add middleware to block editor routes in production"
```

---

### Task 25: Verify ESLint Boundaries (All Code Written)

ESLint boundaries were configured in Task 2b. Now verify all code passes.

- [ ] **Step 1: Run full lint**

```bash
npm run lint
```

Fix any boundary violations. Common issues:
- Lightbox importing from puck-block (should use `_shared/`)
- App routes importing from `@puckeditor/core` (should use `@/types/puck` or `@/lib/puck/`)

- [ ] **Step 2: Commit any fixes**

```bash
git add -A
git commit -m "fix: resolve ESLint boundary violations"
```

---

### Task 26: Final Integration Test

**Files:**
- No new files — end-to-end verification

- [ ] **Step 1: Full build test**

```bash
npm run build
```

Expected: Build succeeds with no errors.

- [ ] **Step 2: Full workflow test**

```bash
npm run dev
```

Test the complete workflow:
1. Visit `/edit/photography` — PageManager shows, editor loads
2. Create new page "gym" via PageManager — redirects to `/edit/gym`
3. Drag an ImageDetailBlock — upload image via Cloudinary widget
4. Drag a ProjectBlock — fill in title, cover image, description
5. Drag another ImageDetailBlock — associate with the project via dropdown
6. Check Project Linker plugin — verify association tree
7. Publish — redirects to `/gym`
8. Click image — lightbox opens with meta overlay
9. Click project — project lightbox opens with associated images
10. Browser back — lightbox closes
11. Deep-link test: visit `/gym?project=<uuid>` — lightbox opens directly
12. Verify PageManager: switch pages, delete a page

- [ ] **Step 3: Lint check**

```bash
npm run lint
```

Expected: No boundary violations.

- [ ] **Step 4: Run all tests**

```bash
npx vitest run
```

Expected: All schema and persistence tests pass.

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "chore: final integration verification — all systems working"
```

---

## Summary

| Phase | Tasks | What It Produces |
|-------|-------|-----------------|
| 1. Scaffolding | 1, 2, 2b, 2c | Clean starter with deps, CLAUDE.md, env vars, ESLint boundaries, image domains |
| 2. Schemas & Types | 3-7 | All Zod schemas with tests, shared types, video-utils |
| 3. Persistence | 8-9 | File-based content CRUD with API routes + per-component validation |
| 4. Puck Core | 10-12 | Config with resolveData IDs, Cloudinary field, project-select field |
| 5. Routes | 13-15 | Editor route (split server/client), published route with ISR, root layout |
| 6. Block Components | 16-18 | ImageDetail, VideoDetail, ProjectBlock — full render components |
| 7. Lightbox | 19-21 | URL-driven lightbox with image/video slides, wired to blocks |
| 8. Page Manager | 22 | CRUD UI for pages in editor |
| 9. Plugin | 23 | Project Linker plugin rail panel |
| 10. Hardening | 24-26 | Middleware, ESLint verification, integration test |
