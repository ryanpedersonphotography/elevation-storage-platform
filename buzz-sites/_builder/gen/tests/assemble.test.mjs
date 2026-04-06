import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { mkdtemp, readFile, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import {
  renderLayout,
  renderPage,
  renderScheduleTourRoute,
  writeFormApiRoutes,
} from "../assemble.mjs"

const makeResolved = (overrides = {}) => ({
  entry: {
    id: "sidebar-glass-gsap:home-hero",
    candidate: "sidebar-glass-gsap",
    name: "HomeHero",
    tier: "recipe",
    archetype: "hero",
    ...overrides.entry,
  },
  content: overrides.content ?? {},
  config: overrides.config ?? {},
  sectionId: overrides.sectionId,
  preExtracted: overrides.preExtracted ?? false,
})

describe("renderLayout meta sanitization", () => {
  it("safely escapes embedded double quotes in title", () => {
    const layout = renderLayout({
      name: "test",
      meta: { title: 'A "Big" Venue', description: "Plain description" },
      theme: "dark",
    })
    // JSON.stringify wraps the string and escapes the quotes
    assert.match(layout, /title: "A \\"Big\\" Venue"/)
    assert.match(layout, /description: "Plain description"/)
  })

  it("handles newlines and control characters in description", () => {
    const layout = renderLayout({
      name: "test",
      meta: { title: "Title", description: "Line one\nLine two\\back" },
      theme: "dark",
    })
    // Newline becomes \n in the JSON literal
    assert.match(layout, /description: "Line one\\nLine two\\\\back"/)
  })

  it("defaults to name when title is missing", () => {
    const layout = renderLayout({ name: "my-page", theme: "dark" })
    assert.match(layout, /title: "my-page"/)
    assert.match(layout, /description: ""/)
  })

  it("defaults theme to dark when omitted", () => {
    const layout = renderLayout({ name: "test" })
    assert.match(layout, /data-theme="dark"/)
  })
})

describe("renderPage import paths", () => {
  it("imports recipe-tier sections from @/system/recipes/<Name>", () => {
    const page = renderPage([
      makeResolved({ entry: { name: "HomeHero", tier: "recipe" } }),
    ])
    assert.match(page, /import \{ HomeHero \} from "@\/system\/recipes\/HomeHero"/)
  })

  it("imports atom-tier sections from @/system/atoms/<Name>", () => {
    const page = renderPage([
      makeResolved({ entry: { name: "SectionDivider", tier: "atom" } }),
    ])
    assert.match(page, /import \{ SectionDivider \} from "@\/system\/atoms\/SectionDivider"/)
  })

  it("renders empty props list when content and config are empty", () => {
    const page = renderPage([
      makeResolved({ entry: { name: "HomeHero", tier: "recipe" } }),
    ])
    // No props → self-closing with just the tag
    assert.match(page, /<HomeHero \/>/)
  })

  it("serializes content props as JSON expression containers", () => {
    const page = renderPage([
      makeResolved({
        entry: { name: "ProofBand", tier: "recipe" },
        content: { items: [{ stat: "100", desc: "Guests" }] },
      }),
    ])
    assert.match(page, /items=\{\[\{"stat":"100","desc":"Guests"\}\]\}/)
  })

  it("dedupes imports for the same section name used twice", () => {
    const page = renderPage([
      makeResolved({ entry: { name: "HomeHero", tier: "recipe" } }),
      makeResolved({ entry: { name: "HomeHero", tier: "recipe" } }),
    ])
    const importCount = (page.match(/import \{ HomeHero \}/g) ?? []).length
    assert.equal(importCount, 1)
  })

  it("passes sectionId as inline id prop when entry.acceptsId is true", () => {
    const page = renderPage([
      makeResolved({
        entry: { name: "HomeHero", tier: "recipe", acceptsId: true },
        sectionId: "home",
      }),
    ])
    assert.match(page, /<HomeHero\s+id=\{"home"\}/)
    assert.doesNotMatch(page, /<div id="home">/)
  })

  it("wraps sections in <div id=...> when entry.acceptsId is falsy", () => {
    const page = renderPage([
      makeResolved({
        entry: { name: "TourForm", tier: "recipe", archetype: "form" },
        sectionId: "contact",
      }),
    ])
    assert.match(page, /<div id="contact">/)
    assert.match(page, /<TourForm \/>/)
  })

  it("does not wrap when sectionId is absent even if acceptsId is false", () => {
    const page = renderPage([
      makeResolved({
        entry: { name: "TourForm", tier: "recipe", archetype: "form" },
      }),
    ])
    assert.doesNotMatch(page, /<div id=/)
    assert.match(page, /<TourForm \/>/)
  })
})

describe("writeFormApiRoutes", () => {
  it("emits /api/schedule-tour/route.ts when a form archetype is present", async () => {
    const dir = await mkdtemp(join(tmpdir(), "assemble-test-"))
    try {
      const resolved = [
        makeResolved({ entry: { name: "TourForm", tier: "recipe", archetype: "form" } }),
      ]
      const routes = await writeFormApiRoutes(resolved, dir)
      assert.deepEqual(routes, ["src/app/api/schedule-tour/route.ts"])
      const content = await readFile(
        join(dir, "src/app/api/schedule-tour/route.ts"),
        "utf8"
      )
      assert.match(content, /export async function POST/)
      assert.match(content, /NextResponse\.json\(\{ ok: true \}\)/)
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it("does nothing when there are no form sections", async () => {
    const dir = await mkdtemp(join(tmpdir(), "assemble-test-"))
    try {
      const resolved = [
        makeResolved({ entry: { name: "HomeHero", tier: "recipe", archetype: "hero" } }),
      ]
      const routes = await writeFormApiRoutes(resolved, dir)
      assert.deepEqual(routes, [])
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })
})

describe("renderScheduleTourRoute", () => {
  it("produces a valid NextResponse POST handler template", () => {
    const source = renderScheduleTourRoute()
    assert.match(source, /import \{ NextResponse \} from "next\/server"/)
    assert.match(source, /export async function POST\(request: Request\)/)
    assert.match(source, /status: 400/)
  })
})
