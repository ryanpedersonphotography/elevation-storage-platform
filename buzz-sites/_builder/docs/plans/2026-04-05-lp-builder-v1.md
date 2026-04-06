# Landing Page Builder V1 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a config-driven CLI that assembles deployable Next.js landing pages from pre-built sections harvested from the sidebar-glass-gsap candidate.

**Architecture:** Pre-extract 4 page-inline sections into standalone components, then build a Node.js generator CLI that reads a JSON page config, copies sections + atoms + tokens into an output directory, generates page/layout composition files, and produces a buildable Next.js project. Adversarial gate reviews after each major phase.

**Tech Stack:** Node.js (ESM), Zod (validation), Next.js 16 (output), CSS Modules + design tokens (styling), Playwright (smoke tests)

**Source candidate:** `candidates/sidebar-glass-gsap/`
**Output location:** `_builder/gen/`
**Pre-extracted sections:** `_builder/extracted/`

---

## Phase 0: Generator CLI Foundation

### Task 1: Scaffold generator directory and install Zod

**Files:**
- Create: `_builder/gen/package.json`
- Create: `_builder/gen/generate.mjs`

- [ ] **Step 1: Create generator package.json**

```json
{
  "name": "lp-builder-gen",
  "version": "0.1.0",
  "type": "module",
  "description": "Landing page generator CLI for buzz-sites",
  "scripts": {
    "generate": "node generate.mjs",
    "test": "node --test tests/"
  },
  "dependencies": {
    "zod": "^3.25.0"
  }
}
```

- [ ] **Step 2: Create minimal CLI entry point**

```js
// _builder/gen/generate.mjs
import { parseArgs } from "node:util"
import { readFile } from "node:fs/promises"
import { resolve } from "node:path"

const { values } = parseArgs({
  options: {
    config: { type: "string", short: "c" },
    out: { type: "string", short: "o", default: "dist" },
    validate: { type: "boolean", default: false },
    "list-sections": { type: "boolean", default: false },
  },
})

if (values["list-sections"]) {
  const registry = JSON.parse(
    await readFile(resolve("..", "registry", "sections.json"), "utf-8")
  )
  const v1 = registry.filter((s) => s.phase === "v1")
  console.log(`\n${v1.length} V1-ready sections:\n`)
  for (const s of v1) {
    const ready = s.extractable ? "READY" : "NEEDS WORK"
    console.log(`  ${s.id.padEnd(45)} ${s.archetype.padEnd(12)} ${ready}`)
  }
  process.exit(0)
}

if (!values.config) {
  console.error("Usage: node generate.mjs --config <path> [--out <dir>]")
  process.exit(1)
}

console.log(`Config: ${values.config}`)
console.log(`Output: ${values.out}`)
console.log("Generator not yet implemented — see Tasks 2+")
```

- [ ] **Step 3: Install dependencies**

Run: `cd _builder/gen && npm install`
Expected: `node_modules/` created, zod installed

- [ ] **Step 4: Test the CLI**

Run: `cd _builder/gen && node generate.mjs --list-sections`
Expected: Lists 11 V1-ready sections with their archetypes

- [ ] **Step 5: Commit**

```bash
git add _builder/gen/package.json _builder/gen/generate.mjs
git commit -m "feat(builder): scaffold generator CLI with --list-sections"
```

---

### Task 2: Page config Zod schema and validator

**Files:**
- Create: `_builder/gen/schema.mjs`
- Create: `_builder/gen/tests/schema.test.mjs`

- [ ] **Step 1: Write the failing test**

```js
// _builder/gen/tests/schema.test.mjs
import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { validateConfig } from "../schema.mjs"

describe("validateConfig", () => {
  it("accepts a valid minimal config", () => {
    const config = {
      name: "test-page",
      baseCandidate: "sidebar-glass-gsap",
      sections: [
        {
          registryId: "sidebar-glass-gsap:home-hero",
          content: { title: "Test" },
        },
      ],
    }
    const result = validateConfig(config)
    assert.equal(result.success, true)
  })

  it("rejects config with missing name", () => {
    const config = { baseCandidate: "sidebar-glass-gsap", sections: [] }
    const result = validateConfig(config)
    assert.equal(result.success, false)
  })

  it("rejects config with empty sections", () => {
    const config = {
      name: "test",
      baseCandidate: "sidebar-glass-gsap",
      sections: [],
    }
    const result = validateConfig(config)
    assert.equal(result.success, false)
  })

  it("rejects config with invalid baseCandidate", () => {
    const config = {
      name: "test",
      baseCandidate: "nonexistent",
      sections: [{ registryId: "x:y", content: {} }],
    }
    const result = validateConfig(config)
    assert.equal(result.success, false)
  })

  it("sanitizes HTML in content strings", () => {
    const config = {
      name: "test",
      baseCandidate: "sidebar-glass-gsap",
      sections: [
        {
          registryId: "sidebar-glass-gsap:home-hero",
          content: { title: '<script>alert("xss")</script>Hero' },
        },
      ],
    }
    const result = validateConfig(config)
    assert.equal(result.success, true)
    assert.equal(
      result.data.sections[0].content.title,
      "Hero"
    )
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd _builder/gen && node --test tests/schema.test.mjs`
Expected: FAIL — `validateConfig` not found

- [ ] **Step 3: Implement schema.mjs**

```js
// _builder/gen/schema.mjs
import { z } from "zod"

const VALID_CANDIDATES = [
  "sidebar-glass-gsap",
  "sidebar-glass",
  "classic-clean",
  "landing-version",
]

/** Strip HTML tags from a string (basic XSS prevention) */
function stripHtml(str) {
  return str.replace(/<[^>]*>/g, "").trim()
}

/** Recursively sanitize all string values in an object */
function sanitizeContent(obj) {
  if (typeof obj === "string") return stripHtml(obj)
  if (Array.isArray(obj)) return obj.map(sanitizeContent)
  if (obj && typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [k, sanitizeContent(v)])
    )
  }
  return obj
}

const SectionSchema = z.object({
  registryId: z.string().regex(/^[\w-]+:[\w-]+$/),
  content: z.record(z.unknown()).default({}),
  config: z.record(z.unknown()).default({}),
  id: z.string().optional(),
})

const PageConfigSchema = z
  .object({
    name: z
      .string()
      .min(1)
      .regex(/^[a-z0-9-]+$/, "name must be kebab-case"),
    baseCandidate: z.enum(VALID_CANDIDATES),
    meta: z
      .object({
        title: z.string().optional(),
        description: z.string().optional(),
        ogImage: z.string().optional(),
      })
      .optional(),
    theme: z.enum(["dark", "light"]).default("dark"),
    sections: z.array(SectionSchema).min(1, "At least one section required"),
  })
  .transform((data) => ({
    ...data,
    sections: data.sections.map((s) => ({
      ...s,
      content: sanitizeContent(s.content),
    })),
  }))

export function validateConfig(raw) {
  const result = PageConfigSchema.safeParse(raw)
  return result
}

export { PageConfigSchema }
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd _builder/gen && node --test tests/schema.test.mjs`
Expected: All 5 tests pass

- [ ] **Step 5: Commit**

```bash
git add _builder/gen/schema.mjs _builder/gen/tests/schema.test.mjs
git commit -m "feat(builder): add Zod page config schema with HTML sanitization"
```

---

### Task 3: Path validator

**Files:**
- Create: `_builder/gen/validate-paths.mjs`
- Create: `_builder/gen/tests/validate-paths.test.mjs`

- [ ] **Step 1: Write the failing test**

```js
// _builder/gen/tests/validate-paths.test.mjs
import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { validateSourcePath, validateRegistryPaths } from "../validate-paths.mjs"

describe("validateSourcePath", () => {
  it("accepts a path within the candidate directory", () => {
    const result = validateSourcePath(
      "src/system/recipes/HomeHero/HomeHero.tsx",
      "/abs/candidates/sidebar-glass-gsap"
    )
    assert.equal(result.valid, true)
  })

  it("rejects a path with .. traversal", () => {
    const result = validateSourcePath(
      "../../.env",
      "/abs/candidates/sidebar-glass-gsap"
    )
    assert.equal(result.valid, false)
    assert.match(result.reason, /traversal/)
  })

  it("rejects absolute paths", () => {
    const result = validateSourcePath(
      "/etc/passwd",
      "/abs/candidates/sidebar-glass-gsap"
    )
    assert.equal(result.valid, false)
  })
})

describe("validateRegistryPaths", () => {
  it("validates all paths in a registry entry", () => {
    const entry = {
      id: "sidebar-glass-gsap:home-hero",
      candidate: "sidebar-glass-gsap",
      source: {
        component: "src/system/recipes/HomeHero/HomeHero.tsx",
        styles: ["src/system/recipes/HomeHero/HomeHero.module.css"],
        dependencies: ["src/system/atoms/Button/Button.tsx"],
        tokens: ["src/styles/tokens/primitives.css"],
      },
    }
    const errors = validateRegistryPaths(entry, "/abs/candidates")
    assert.equal(errors.length, 0)
  })

  it("returns errors for traversal paths", () => {
    const entry = {
      id: "bad:entry",
      candidate: "sidebar-glass-gsap",
      source: {
        component: "../../../etc/passwd",
        styles: [],
        dependencies: [],
        tokens: [],
      },
    }
    const errors = validateRegistryPaths(entry, "/abs/candidates")
    assert.ok(errors.length > 0)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd _builder/gen && node --test tests/validate-paths.test.mjs`
Expected: FAIL

- [ ] **Step 3: Implement validate-paths.mjs**

```js
// _builder/gen/validate-paths.mjs
import { resolve, isAbsolute, relative } from "node:path"

export function validateSourcePath(sourcePath, candidateRoot) {
  if (isAbsolute(sourcePath)) {
    return { valid: false, reason: "Absolute paths not allowed" }
  }
  if (sourcePath.includes("..")) {
    return { valid: false, reason: `Path traversal detected: ${sourcePath}` }
  }
  const resolved = resolve(candidateRoot, sourcePath)
  const rel = relative(candidateRoot, resolved)
  if (rel.startsWith("..")) {
    return { valid: false, reason: `Path escapes candidate directory: ${sourcePath}` }
  }
  return { valid: true, resolved }
}

export function validateRegistryPaths(entry, candidatesRoot) {
  const errors = []
  const root = resolve(candidatesRoot, entry.candidate)
  const paths = [
    entry.source.component,
    ...entry.source.styles,
    ...entry.source.dependencies,
    ...entry.source.tokens,
  ]
  for (const p of paths) {
    const result = validateSourcePath(p, root)
    if (!result.valid) {
      errors.push(`${entry.id}: ${result.reason}`)
    }
  }
  return errors
}
```

- [ ] **Step 4: Run tests**

Run: `cd _builder/gen && node --test tests/validate-paths.test.mjs`
Expected: All pass

- [ ] **Step 5: Commit**

```bash
git add _builder/gen/validate-paths.mjs _builder/gen/tests/validate-paths.test.mjs
git commit -m "feat(builder): add path traversal validation for registry entries"
```

---

## Phase 1: Pre-Extract Page-Inline Sections

These 4 sections are currently inline JSX in `candidates/sidebar-glass-gsap/src/app/page.tsx`. We carve each into a standalone component in `_builder/extracted/`.

### Task 4: Carve ProofBand into standalone component

**Files:**
- Create: `_builder/extracted/ProofBand/ProofBand.tsx`
- Create: `_builder/extracted/ProofBand/ProofBand.module.css`

**Source:** `candidates/sidebar-glass-gsap/src/app/page.tsx` lines 88-100 (JSX), lines 31-36 (data)
**CSS source:** `candidates/sidebar-glass-gsap/src/app/page.module.css` — classes: `.proofBand`, `.proofGrid`, `.proofItem`, `.proofStat`, `.proofDesc`, `.proofDivider`

- [ ] **Step 1: Create ProofBand.tsx**

Read the exact CSS classes from `page.module.css` for proofBand/proofGrid/proofItem/proofStat/proofDesc/proofDivider, then create the standalone component:

```tsx
// _builder/extracted/ProofBand/ProofBand.tsx
import styles from "./ProofBand.module.css"

export interface ProofPoint {
  stat: string
  desc: string
}

export interface ProofBandProps {
  id?: string
  items: ProofPoint[]
  className?: string
}

export function ProofBand({ id = "proof", items, className }: ProofBandProps) {
  return (
    <section id={id} className={`${styles.proofBand} ${className ?? ""}`} data-reveal>
      <div className={styles.proofGrid} data-animate="fade-up">
        {items.map((point, i) => (
          <div key={point.stat} className={styles.proofItem}>
            <span className={styles.proofStat}>{point.stat}</span>
            <span className={styles.proofDesc}>{point.desc}</span>
            {i < items.length - 1 && (
              <span className={styles.proofDivider} aria-hidden="true" />
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Extract ProofBand CSS classes from page.module.css**

Read `candidates/sidebar-glass-gsap/src/app/page.module.css`, find and copy only the `.proofBand`, `.proofGrid`, `.proofItem`, `.proofStat`, `.proofDesc`, `.proofDivider` rules into `_builder/extracted/ProofBand/ProofBand.module.css`. Preserve all the exact CSS — glass-plate backdrop, bronze dividers, responsive breakpoints.

- [ ] **Step 3: Verify the component compiles**

The component uses only CSS Modules (no atom imports). It should be self-contained. Verify the CSS references match.

- [ ] **Step 4: Commit**

```bash
git add _builder/extracted/ProofBand/
git commit -m "feat(builder): pre-extract ProofBand as standalone component"
```

---

### Task 5: Carve SettingSection into standalone component

**Files:**
- Create: `_builder/extracted/SettingSection/SettingSection.tsx`
- Create: `_builder/extracted/SettingSection/SettingSection.module.css`

**Source:** `page.tsx` lines 110-161 (JSX), lines 14-25 (data)
**Dependencies:** PageSection recipe, Image atom
**CSS source:** `.settingSection`, `.settingEyebrow`, `.settingTitle`, `.settingBody`, `.settingList`, `.settingItem`, `.settingCheck`, `.settingImage`, `.settingJewelFrame`, `.settingGlassPlate`

- [ ] **Step 1: Create SettingSection.tsx**

```tsx
// _builder/extracted/SettingSection/SettingSection.tsx
import { PageSection } from "@/system/recipes/PageSection"
import { Image } from "@/system/atoms/Image"
import styles from "./SettingSection.module.css"

export interface SettingSectionProps {
  id?: string
  eyebrow: string
  title: string
  body: string
  features: string[]
  image: string
  imageAlt?: string
  className?: string
}

export function SettingSection({
  id = "features",
  eyebrow,
  title,
  body,
  features,
  image,
  imageAlt,
  className,
}: SettingSectionProps) {
  return (
    <PageSection
      id={id}
      layout="split"
      bg="base"
      gridWeight="wide-narrow"
      divider="seam"
      dividerFrom="base"
      className={`${styles.settingSection} ${className ?? ""}`}
    >
      <PageSection.Content>
        <p className={styles.settingEyebrow}>{eyebrow}</p>
        <h2 className={styles.settingTitle}>{title}</h2>
        <p className={styles.settingBody}>{body}</p>
        <ul className={styles.settingList}>
          {features.map((f) => (
            <li key={f} className={styles.settingItem}>
              <svg
                className={styles.settingCheck}
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M20 6L9 17l-5-5" />
              </svg>
              <span>{f}</span>
            </li>
          ))}
        </ul>
      </PageSection.Content>
      <PageSection.Media className={styles.settingImage}>
        <div className={styles.settingJewelFrame}>
          <div className={styles.settingGlassPlate}>
            <Image
              src={image}
              alt={imageAlt ?? title}
              fill
              fit="cover"
              size="card"
              surface="none"
              shadow="none"
              radius="none"
            />
          </div>
        </div>
      </PageSection.Media>
    </PageSection>
  )
}
```

- [ ] **Step 2: Extract SettingSection CSS classes from page.module.css**

Copy `.settingSection`, `.settingEyebrow`, `.settingTitle`, `.settingBody`, `.settingList`, `.settingItem`, `.settingCheck`, `.settingImage`, `.settingJewelFrame`, `.settingGlassPlate` and all their responsive variants.

- [ ] **Step 3: Commit**

```bash
git add _builder/extracted/SettingSection/
git commit -m "feat(builder): pre-extract SettingSection as standalone component"
```

---

### Task 6: Carve EmotionalBanner into standalone component

**Files:**
- Create: `_builder/extracted/EmotionalBanner/EmotionalBanner.tsx`
- Create: `_builder/extracted/EmotionalBanner/EmotionalBanner.module.css`

**Source:** `page.tsx` lines 182-206
**Dependencies:** Image atom
**CSS source:** `.emotionalBanner`, `.bannerImageWrap`, `.bannerOverlay`, `.bannerContent`, `.bannerVellum`, `.bannerTitle`, `.bannerSubline`

- [ ] **Step 1: Create EmotionalBanner.tsx**

```tsx
// _builder/extracted/EmotionalBanner/EmotionalBanner.tsx
import { Image } from "@/system/atoms/Image"
import styles from "./EmotionalBanner.module.css"

export interface EmotionalBannerProps {
  title: string
  subline: string
  image: string
  imageAlt?: string
  className?: string
}

export function EmotionalBanner({
  title,
  subline,
  image,
  imageAlt,
  className,
}: EmotionalBannerProps) {
  return (
    <section className={`${styles.emotionalBanner} ${className ?? ""}`} data-reveal>
      <div className={styles.bannerImageWrap}>
        <Image
          src={image}
          alt={imageAlt ?? title}
          fill
          fit="cover"
          size="hero"
          surface="none"
          shadow="none"
          radius="none"
        />
        <div className={styles.bannerOverlay} />
        <div className={styles.bannerContent}>
          <div className={styles.bannerVellum} data-animate="fade-up">
            <h2 className={styles.bannerTitle}>{title}</h2>
            <p className={styles.bannerSubline}>{subline}</p>
          </div>
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Extract EmotionalBanner CSS from page.module.css**

- [ ] **Step 3: Commit**

```bash
git add _builder/extracted/EmotionalBanner/
git commit -m "feat(builder): pre-extract EmotionalBanner as standalone component"
```

---

### Task 7: Carve PlanningSection into standalone component

**Files:**
- Create: `_builder/extracted/PlanningSection/PlanningSection.tsx`
- Create: `_builder/extracted/PlanningSection/PlanningSection.module.css`

**Source:** `page.tsx` lines 209-240, data at lines 59-66
**CSS source:** `.planningSection`, `.planningInner`, `.planningHeader`, `.planningEyebrow`, `.planningTitle`, `.planningBody`, `.planningGrid`, `.planningItem`, `.planningCheck`
**Layout note:** Uses negative margin overlap with emotional banner above. Document in comments.

- [ ] **Step 1: Create PlanningSection.tsx**

```tsx
// _builder/extracted/PlanningSection/PlanningSection.tsx
import styles from "./PlanningSection.module.css"

export interface PlanningSectionProps {
  eyebrow: string
  title: string
  body: string
  items: string[]
  className?: string
}

/**
 * Planning checklist section.
 * Layout note: CSS uses negative margin to overlap the section above (emotional banner).
 * The rounded top corners and z-index create the "pull-up" effect.
 * This effect is context-dependent — works best when placed after EmotionalBanner.
 */
export function PlanningSection({
  eyebrow,
  title,
  body,
  items,
  className,
}: PlanningSectionProps) {
  return (
    <section className={`${styles.planningSection} ${className ?? ""}`} data-reveal>
      <div className={styles.planningInner}>
        <div className={styles.planningHeader}>
          <p className={styles.planningEyebrow}>{eyebrow}</p>
          <h2 className={styles.planningTitle}>{title}</h2>
          <p className={styles.planningBody}>{body}</p>
        </div>
        <ul className={styles.planningGrid} data-animate="fade-up">
          {items.map((item) => (
            <li key={item} className={styles.planningItem}>
              <svg
                className={styles.planningCheck}
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M20 6L9 17l-5-5" />
              </svg>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Extract PlanningSection CSS from page.module.css**

Include the negative margin, rounded top corners, z-index, and all responsive rules.

- [ ] **Step 3: Commit**

```bash
git add _builder/extracted/PlanningSection/
git commit -m "feat(builder): pre-extract PlanningSection as standalone component"
```

---

### Task 8: GATE REVIEW 1 — Adversarial review of pre-extracted components

**Purpose:** Verify the 4 carved components are complete, correct, and match the source visuals.

- [ ] **Step 1: Dispatch adversarial reviewers in parallel**

```
Agent(subagent_type="cross-model-reviewer", prompt="""
Review the 4 pre-extracted landing page builder components for completeness and correctness.

Files to review:
- _builder/extracted/ProofBand/ProofBand.tsx + ProofBand.module.css
- _builder/extracted/SettingSection/SettingSection.tsx + SettingSection.module.css
- _builder/extracted/EmotionalBanner/EmotionalBanner.tsx + EmotionalBanner.module.css
- _builder/extracted/PlanningSection/PlanningSection.tsx + PlanningSection.module.css

Compare against the source:
- candidates/sidebar-glass-gsap/src/app/page.tsx (original inline JSX)
- candidates/sidebar-glass-gsap/src/app/page.module.css (original CSS)

Check:
1. All JSX from the source is preserved in the extracted component
2. All CSS classes used are present in the extracted module CSS
3. Props interface covers all hardcoded content from the source
4. Import paths use @/ aliases correctly
5. Layout relationship comments are accurate (negative margins, z-index, overlap)
6. No CSS classes were missed or extra classes included
7. TypeScript types are correct and complete

Rate: PASS, WARN, or FAIL per component with specific findings.
""")
```

- [ ] **Step 2: Address any FAIL or critical WARN findings**

Fix issues identified by reviewers before proceeding.

- [ ] **Step 3: Commit fixes if any**

---

## Phase 2: Generator Core

### Task 9: Section resolver — look up registry IDs and validate

**Files:**
- Create: `_builder/gen/resolve.mjs`
- Create: `_builder/gen/tests/resolve.test.mjs`

- [ ] **Step 1: Write the failing test**

```js
// _builder/gen/tests/resolve.test.mjs
import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { resolveSections } from "../resolve.mjs"

const MOCK_REGISTRY = [
  {
    id: "sidebar-glass-gsap:home-hero",
    phase: "v1",
    extractable: true,
    extractionComplexity: "ready",
    source: { component: "src/system/recipes/HomeHero/HomeHero.tsx", styles: [], dependencies: [], tokens: [] },
  },
  {
    id: "sidebar-glass-gsap:proof-band",
    phase: "v1",
    extractable: false,
    extractionComplexity: "requires-refactor",
    source: { component: "src/app/page.tsx", styles: [], dependencies: [], tokens: [] },
  },
  {
    id: "classic-clean:hero",
    phase: "v2",
    extractable: false,
    extractionComplexity: "requires-rewrite",
    source: { component: "src/pages/HomePage.jsx", styles: [], dependencies: [], tokens: [] },
  },
]

describe("resolveSections", () => {
  it("resolves valid V1 section IDs", () => {
    const result = resolveSections(
      [{ registryId: "sidebar-glass-gsap:home-hero", content: {} }],
      MOCK_REGISTRY
    )
    assert.equal(result.errors.length, 0)
    assert.equal(result.resolved.length, 1)
    assert.equal(result.resolved[0].entry.id, "sidebar-glass-gsap:home-hero")
  })

  it("returns error for unknown registry ID", () => {
    const result = resolveSections(
      [{ registryId: "nonexistent:section", content: {} }],
      MOCK_REGISTRY
    )
    assert.equal(result.errors.length, 1)
    assert.match(result.errors[0], /not found/)
  })

  it("warns for non-V1 sections", () => {
    const result = resolveSections(
      [{ registryId: "classic-clean:hero", content: {} }],
      MOCK_REGISTRY
    )
    assert.ok(result.warnings.length > 0)
    assert.match(result.warnings[0], /v2/)
  })

  it("flags requires-refactor sections as needing pre-extraction", () => {
    const result = resolveSections(
      [{ registryId: "sidebar-glass-gsap:proof-band", content: {} }],
      MOCK_REGISTRY
    )
    assert.ok(result.resolved[0].preExtracted)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

- [ ] **Step 3: Implement resolve.mjs**

```js
// _builder/gen/resolve.mjs
export function resolveSections(configSections, registry) {
  const errors = []
  const warnings = []
  const resolved = []

  for (const section of configSections) {
    const entry = registry.find((r) => r.id === section.registryId)
    if (!entry) {
      errors.push(`Section "${section.registryId}" not found in registry`)
      continue
    }
    if (entry.phase !== "v1" && entry.phase !== "v1.5") {
      warnings.push(
        `Section "${section.registryId}" is phase ${entry.phase} — not V1-ready. Extraction may fail.`
      )
    }
    if (entry.extractionComplexity === "requires-rewrite") {
      errors.push(
        `Section "${section.registryId}" requires a framework rewrite and cannot be extracted automatically.`
      )
      continue
    }
    resolved.push({
      entry,
      content: section.content ?? {},
      config: section.config ?? {},
      sectionId: section.id,
      preExtracted: entry.extractionComplexity === "requires-refactor",
    })
  }

  return { resolved, errors, warnings }
}
```

- [ ] **Step 4: Run tests**

- [ ] **Step 5: Commit**

```bash
git add _builder/gen/resolve.mjs _builder/gen/tests/resolve.test.mjs
git commit -m "feat(builder): add section resolver with phase and complexity checking"
```

---

### Task 10: Dependency graph builder

**Files:**
- Create: `_builder/gen/resolve-deps.mjs`
- Create: `_builder/gen/tests/resolve-deps.test.mjs`

- [ ] **Step 1: Write the failing test**

Test that it collects all in-tree dependencies from resolved sections, deduplicates atoms, aggregates npm deps, and detects conflicts.

- [ ] **Step 2: Implement resolve-deps.mjs**

Walk the registry entries' `source.dependencies` arrays. For each dependency, check if it's an atom, recipe, or utility. Build a map of `{ atomName → sourcePath }`. If two sections need different implementations of the same atom name, report a conflict. Collect all `npmDeps` from all entries and merge.

- [ ] **Step 3: Run tests**

- [ ] **Step 4: Commit**

---

### Task 11: Section copier

**Files:**
- Create: `_builder/gen/copy-sections.mjs`
- Create: `_builder/gen/tests/copy-sections.test.mjs`

- [ ] **Step 1: Write the failing test**

Test that it copies section files (TSX + CSS module) from source candidate to output directory. For pre-extracted sections, copy from `_builder/extracted/` instead.

- [ ] **Step 2: Implement copy-sections.mjs**

Uses `fs.cp` to copy directories. For recipe-tier sections (`extractionComplexity: "ready"`), copies from `candidates/{candidate}/{source.component}` parent directory. For pre-extracted sections, copies from `_builder/extracted/{name}/`. Also copies all resolved atom dependencies to `{output}/system/atoms/`.

- [ ] **Step 3: Run tests**

- [ ] **Step 4: Commit**

---

### Task 12: Page assembler — generate page.tsx and layout.tsx

**Files:**
- Create: `_builder/gen/assemble.mjs`
- Create: `_builder/gen/tests/assemble.test.mjs`

- [ ] **Step 1: Write the failing test**

Test that it generates valid TypeScript for page.tsx (imports each section, renders in order with content props) and layout.tsx (fonts, metadata, theme).

- [ ] **Step 2: Implement assemble.mjs**

Generate `page.tsx` by:
1. Creating import statements for each section
2. Rendering sections in config order inside `<main>`
3. Passing content as props to each section
4. Adding SectionDivider between sections where `layoutRelationships` indicate dividers
5. Wrapping in ProSidebar layout if nav section is included

Generate `layout.tsx` with:
1. next/font/google imports for Playfair Display, Lato, Libre Franklin, Parisienne
2. Metadata from config.meta
3. Theme initialization script (data-theme + localStorage)
4. globals.css import

Generate `globals.css` that imports all 4 token tiers + layout-utilities + reset.

- [ ] **Step 3: Run tests**

- [ ] **Step 4: Commit**

---

### Task 13: Package.json generator

**Files:**
- Create: `_builder/gen/aggregate-npm.mjs`

- [ ] **Step 1: Implement**

Takes resolved npm deps from dependency manifest and generates a complete `package.json` with:
- `next`, `react`, `react-dom`, `typescript` at versions matching sidebar-glass-gsap
- All section npm deps (`@heroicons/react`, etc.)
- Dev deps: `@types/react`, `@types/react-dom`, `@types/node`
- Scripts: `dev`, `build`, `start`, `lint`

- [ ] **Step 2: Commit**

---

### Task 14: Wire up the full CLI pipeline

**Files:**
- Modify: `_builder/gen/generate.mjs`

- [ ] **Step 1: Wire up all modules into the CLI**

Update `generate.mjs` to:
1. Read and validate config (schema.mjs)
2. Load and validate registry paths (validate-paths.mjs)
3. Resolve sections (resolve.mjs)
4. Build dependency graph (resolve-deps.mjs)
5. Create temp output directory
6. Copy sections and atoms (copy-sections.mjs)
7. Copy token files
8. Generate page.tsx, layout.tsx, globals.css (assemble.mjs)
9. Generate package.json (aggregate-npm.mjs)
10. Generate tsconfig.json, next.config.mjs
11. Generate API route if form section included
12. Move temp dir to final output on success

- [ ] **Step 2: Test with --validate flag**

Run: `cd _builder/gen && node generate.mjs --config ../pages/example.json --validate`
Expected: Validation passes (after creating example.json in Task 15)

- [ ] **Step 3: Commit**

```bash
git add _builder/gen/generate.mjs
git commit -m "feat(builder): wire up full generator CLI pipeline"
```

---

### Task 15: GATE REVIEW 2 — Adversarial review of generator core

- [ ] **Step 1: Dispatch adversarial reviewers**

```
Agent(subagent_type="cross-model-reviewer", prompt="""
Review the landing page generator CLI for correctness, security, and completeness.

Files to review:
- _builder/gen/generate.mjs (CLI entry)
- _builder/gen/schema.mjs (Zod validation)
- _builder/gen/validate-paths.mjs (path safety)
- _builder/gen/resolve.mjs (section resolver)
- _builder/gen/resolve-deps.mjs (dependency graph)
- _builder/gen/copy-sections.mjs (file copier)
- _builder/gen/assemble.mjs (page/layout generator)
- _builder/gen/aggregate-npm.mjs (package.json generator)
- _builder/gen/tests/ (all test files)

Check:
1. Path traversal prevention is complete — no way to read files outside candidate dirs
2. HTML sanitization catches script injection in content strings
3. Dependency deduplication handles all edge cases (same atom from same candidate = OK, different candidate = error)
4. Generated TypeScript is syntactically valid
5. Generated package.json has all required deps
6. Temp dir → final dir atomic move is implemented
7. Error messages are actionable
8. All test assertions are meaningful (not just testing happy paths)

Rate: PASS, WARN, or FAIL per module with specific findings.
""")
```

- [ ] **Step 2: Address findings**

- [ ] **Step 3: Commit fixes**

---

## Phase 3: First Generation Test

### Task 16: Create example page config and generate

**Files:**
- Create: `_builder/pages/example-venue.json`

- [ ] **Step 1: Create example config**

```json
{
  "name": "example-venue",
  "baseCandidate": "sidebar-glass-gsap",
  "theme": "dark",
  "meta": {
    "title": "Example Wedding Venue",
    "description": "A beautiful wedding venue"
  },
  "sections": [
    {
      "registryId": "sidebar-glass-gsap:home-hero",
      "id": "home",
      "content": {
        "title": "Example Wedding Venue",
        "subtitle": "Where your story begins"
      }
    },
    {
      "registryId": "sidebar-glass-gsap:proof-band",
      "id": "proof",
      "content": {
        "items": [
          { "stat": "200 Acres", "desc": "Rolling countryside" },
          { "stat": "Up to 250", "desc": "Indoor and outdoor" },
          { "stat": "3 Venues", "desc": "Barn, garden, lake" },
          { "stat": "90 min", "desc": "From the city" }
        ]
      }
    },
    {
      "registryId": "sidebar-glass-gsap:gallery-carousel",
      "id": "gallery",
      "content": {
        "accent": "Our Spaces",
        "title": "Every Corner Tells a Story",
        "cards": [
          { "src": "/images/barn.jpg", "alt": "The barn", "title": "The Barn", "description": "Soaring beams and warm light." },
          { "src": "/images/garden.jpg", "alt": "The garden", "title": "The Garden", "description": "Open air under ancient oaks." },
          { "src": "/images/lake.jpg", "alt": "The lake", "title": "The Lake", "description": "Sunset ceremonies on the water." }
        ]
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

- [ ] **Step 2: Run the generator**

Run: `cd _builder/gen && node generate.mjs --config ../pages/example-venue.json --out ../dist/example-venue`
Expected: Output directory created with full Next.js project

- [ ] **Step 3: Build the generated project**

Run: `cd _builder/dist/example-venue && npm install && npm run build`
Expected: Build succeeds with no errors

- [ ] **Step 4: Commit**

```bash
git add _builder/pages/example-venue.json
git commit -m "feat(builder): add example venue page config and verify generation"
```

---

### Task 17: Smoke test the generated page

**Files:**
- Create: `_builder/gen/tests/smoke.test.mjs`

- [ ] **Step 1: Write integration smoke test**

```js
// _builder/gen/tests/smoke.test.mjs
import { describe, it, before, after } from "node:test"
import assert from "node:assert/strict"
import { execSync, spawn } from "node:child_process"
import { existsSync } from "node:fs"
import { resolve } from "node:path"

const OUTPUT_DIR = resolve(import.meta.dirname, "../../dist/example-venue")

describe("Generated page smoke test", () => {
  it("output directory exists", () => {
    assert.ok(existsSync(OUTPUT_DIR))
  })

  it("has required files", () => {
    const required = [
      "app/page.tsx",
      "app/layout.tsx",
      "app/globals.css",
      "package.json",
      "tsconfig.json",
      "next.config.mjs",
    ]
    for (const file of required) {
      assert.ok(
        existsSync(resolve(OUTPUT_DIR, file)),
        `Missing: ${file}`
      )
    }
  })

  it("npm install succeeds", () => {
    execSync("npm install", { cwd: OUTPUT_DIR, stdio: "pipe" })
  })

  it("npm run build succeeds", () => {
    execSync("npm run build", { cwd: OUTPUT_DIR, stdio: "pipe", timeout: 120000 })
  })
})
```

- [ ] **Step 2: Run smoke test**

Run: `cd _builder/gen && node --test tests/smoke.test.mjs`
Expected: All pass — generated project installs and builds

- [ ] **Step 3: Commit**

---

### Task 18: GATE REVIEW 3 — Final adversarial review

- [ ] **Step 1: Dispatch final adversarial review**

```
Agent(subagent_type="cross-model-reviewer", prompt="""
Final review of the complete landing page builder V1.

Review the generated output at _builder/dist/example-venue/:
1. Does app/page.tsx correctly import and render all 4 sections?
2. Does app/layout.tsx set up fonts, metadata, and theme correctly?
3. Does globals.css import all required token files?
4. Does package.json include all needed dependencies?
5. Are TypeScript types correct?
6. Would this page render correctly in a browser?

Also review the full builder codebase:
- _builder/gen/ (all generator modules)
- _builder/extracted/ (all pre-extracted components)
- _builder/registry/sections.json (registry accuracy)

Final assessment: Is this builder ready for Ryan to use for generating client landing pages? What are the remaining risks?
""")
```

- [ ] **Step 2: Address any critical findings**

- [ ] **Step 3: Final commit**

```bash
git commit -m "feat(builder): V1 landing page builder complete — generate from config"
```

---

## Summary

| Phase | Tasks | Gate Review | What it produces |
|-------|-------|------------|-----------------|
| Phase 0 | Tasks 1-3 | — | Generator CLI scaffold, Zod schema, path validator |
| Phase 1 | Tasks 4-7 | Gate 1 (Task 8) | 4 pre-extracted page-inline components |
| Phase 2 | Tasks 9-14 | Gate 2 (Task 15) | Generator core: resolve → copy → assemble → package |
| Phase 3 | Tasks 16-17 | Gate 3 (Task 18) | Working example generation + smoke test |

**Total: 18 tasks, 3 adversarial gate reviews**

Each gate review dispatches the `cross-model-reviewer` agent which runs `rival-reviewer` (competitive adversarial review for boundary violations, security, type safety) and `structural-reviewer` (duplication, naming consistency, architecture drift) in parallel, then synthesizes a unified assessment.
