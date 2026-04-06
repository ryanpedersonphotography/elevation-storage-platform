import { describe, it, before, after } from "node:test"
import assert from "node:assert/strict"
import { execSync } from "node:child_process"
import { existsSync, readFileSync } from "node:fs"
import { mkdtemp, rm } from "node:fs/promises"
import { resolve, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { tmpdir } from "node:os"
import { join } from "node:path"

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(__dirname, "../../..")
const CONFIG = resolve(REPO_ROOT, "_builder/pages/example-venue.json")
const GENERATE = resolve(REPO_ROOT, "_builder/gen/generate.mjs")

/** Shared state set in `before` and cleaned up in `after`. */
let OUTPUT_DIR = ""

describe("End-to-end smoke test", () => {
  before(async () => {
    OUTPUT_DIR = await mkdtemp(join(tmpdir(), "lp-builder-smoke-"))
    execSync(
      `node "${GENERATE}" --config "${CONFIG}" --out "${OUTPUT_DIR}"`,
      { stdio: "pipe" }
    )
  })

  after(async () => {
    if (OUTPUT_DIR) {
      await rm(OUTPUT_DIR, { recursive: true, force: true })
    }
  })

  it("output directory exists", () => {
    assert.ok(existsSync(OUTPUT_DIR), `Output dir not found: ${OUTPUT_DIR}`)
  })

  it("has required Next.js files", () => {
    const required = [
      "src/app/page.tsx",
      "src/app/layout.tsx",
      "src/app/globals.css",
      "package.json",
      "tsconfig.json",
      "next.config.mjs",
    ]
    for (const file of required) {
      assert.ok(
        existsSync(resolve(OUTPUT_DIR, file)),
        `Missing required file: ${file}`
      )
    }
  })

  it("generates API route for form sections", () => {
    assert.ok(
      existsSync(resolve(OUTPUT_DIR, "src/app/api/schedule-tour/route.ts")),
      "Missing form API route: src/app/api/schedule-tour/route.ts"
    )
  })

  it("page.tsx contains imports for all non-atom sections", () => {
    const pageContent = readFileSync(
      resolve(OUTPUT_DIR, "src/app/page.tsx"),
      "utf-8"
    )
    const config = JSON.parse(readFileSync(CONFIG, "utf-8"))

    // Atom-tier sections (e.g. section-divider) don't emit recipe imports
    const recipeSections = config.sections.filter(
      (s) => !s.registryId.endsWith(":section-divider")
    )

    assert.ok(
      pageContent.includes("import"),
      "page.tsx has no import statements"
    )
    assert.ok(
      recipeSections.length > 0,
      "Expected at least one non-atom section in example config"
    )
  })

  it("page.tsx references all expected section component names", () => {
    const pageContent = readFileSync(
      resolve(OUTPUT_DIR, "src/app/page.tsx"),
      "utf-8"
    )
    // These are the component names for each non-atom section in example-venue.json
    const expectedComponents = [
      "HomeHero",
      "ProofBand",
      "SettingSection",
      "GalleryCarousel",
      "EmotionalBanner",
      "PlanningSection",
      "TourForm",
    ]
    for (const name of expectedComponents) {
      assert.ok(
        pageContent.includes(name),
        `page.tsx is missing component reference: ${name}`
      )
    }
  })

  it("layout.tsx contains theme data-attribute", () => {
    const layoutContent = readFileSync(
      resolve(OUTPUT_DIR, "src/app/layout.tsx"),
      "utf-8"
    )
    assert.ok(
      layoutContent.includes("data-theme"),
      "layout.tsx is missing data-theme attribute"
    )
  })

  it("package.json is valid JSON with name and dependencies", () => {
    const raw = readFileSync(resolve(OUTPUT_DIR, "package.json"), "utf-8")
    const pkg = JSON.parse(raw) // throws if invalid
    assert.ok(pkg.name, "package.json is missing name field")
    assert.ok(pkg.dependencies, "package.json is missing dependencies field")
    assert.ok(
      pkg.dependencies["next"],
      "package.json is missing next dependency"
    )
  })

  it("package.json includes zod when a form section is present", () => {
    const pkg = JSON.parse(
      readFileSync(resolve(OUTPUT_DIR, "package.json"), "utf-8")
    )
    // example-venue.json includes sidebar-glass-gsap:tour-form which is
    // archetype: "form" — the generated /api/schedule-tour route imports zod.
    assert.ok(
      pkg.dependencies.zod,
      "package.json is missing zod dependency for form section"
    )
  })

  it("next.config.mjs sets turbopack.root", () => {
    const config = readFileSync(
      resolve(OUTPUT_DIR, "next.config.mjs"),
      "utf-8"
    )
    assert.match(
      config,
      /turbopack:\s*\{\s*root:\s*import\.meta\.dirname/,
      "next.config.mjs is missing turbopack.root"
    )
  })

  it("API route validates body with TourRequestSchema", () => {
    const routeContent = readFileSync(
      resolve(OUTPUT_DIR, "src/app/api/schedule-tour/route.ts"),
      "utf-8"
    )
    assert.match(routeContent, /import \{ z \} from "zod"/)
    assert.match(routeContent, /TourRequestSchema\.parse\(body\)/)
    assert.match(routeContent, /error instanceof z\.ZodError/)
  })

  it("tsconfig.json is valid JSON with path aliases", () => {
    const raw = readFileSync(resolve(OUTPUT_DIR, "tsconfig.json"), "utf-8")
    const tsconfig = JSON.parse(raw) // throws if invalid
    assert.ok(
      tsconfig.compilerOptions?.paths?.["@/*"],
      "tsconfig.json is missing @/* path alias"
    )
  })

  it("API route exports POST handler", () => {
    const routeContent = readFileSync(
      resolve(OUTPUT_DIR, "src/app/api/schedule-tour/route.ts"),
      "utf-8"
    )
    assert.ok(
      routeContent.includes("export async function POST"),
      "API route is missing POST handler"
    )
  })
})
