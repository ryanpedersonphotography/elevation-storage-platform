import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { resolveDependencies } from "../resolve-deps.mjs"

const makeResolved = (entry, content = {}) => ({
  entry,
  content,
  config: {},
  sectionId: undefined,
  preExtracted: false,
})

describe("resolveDependencies", () => {
  it("collects atom dependencies from a single section", () => {
    const resolved = [
      makeResolved({
        id: "sidebar-glass-gsap:home-hero",
        candidate: "sidebar-glass-gsap",
        npmDeps: [],
        source: {
          component: "src/system/recipes/HomeHero/HomeHero.tsx",
          styles: [],
          dependencies: ["src/system/atoms/Button/Button.tsx"],
          tokens: [],
        },
      }),
    ]
    const result = resolveDependencies(resolved)
    assert.equal(result.atoms.length, 1)
    assert.equal(result.atoms[0].name, "Button")
    assert.equal(result.atoms[0].candidate, "sidebar-glass-gsap")
    assert.deepEqual(result.atoms[0].usedBy, ["sidebar-glass-gsap:home-hero"])
  })

  it("deduplicates atoms used by multiple sections", () => {
    const resolved = [
      makeResolved({
        id: "sidebar-glass-gsap:home-hero",
        candidate: "sidebar-glass-gsap",
        npmDeps: [],
        source: {
          component: "src/system/recipes/HomeHero/HomeHero.tsx",
          styles: [],
          dependencies: ["src/system/atoms/Button/Button.tsx"],
          tokens: [],
        },
      }),
      makeResolved({
        id: "sidebar-glass-gsap:tour-form",
        candidate: "sidebar-glass-gsap",
        npmDeps: [],
        source: {
          component: "src/system/recipes/TourForm/TourForm.tsx",
          styles: [],
          dependencies: ["src/system/atoms/Button/Button.tsx"],
          tokens: [],
        },
      }),
    ]
    const result = resolveDependencies(resolved)
    assert.equal(result.atoms.length, 1)
    assert.equal(result.atoms[0].usedBy.length, 2)
    assert.ok(result.atoms[0].usedBy.includes("sidebar-glass-gsap:home-hero"))
    assert.ok(result.atoms[0].usedBy.includes("sidebar-glass-gsap:tour-form"))
    assert.equal(result.conflicts.length, 0)
  })

  it("detects conflicts when same atom name comes from different candidates", () => {
    const resolved = [
      makeResolved({
        id: "sidebar-glass-gsap:home-hero",
        candidate: "sidebar-glass-gsap",
        npmDeps: [],
        source: {
          component: "src/system/recipes/HomeHero/HomeHero.tsx",
          styles: [],
          dependencies: ["src/system/atoms/Button/Button.tsx"],
          tokens: [],
        },
      }),
      makeResolved({
        id: "sidebar-glass:hero",
        candidate: "sidebar-glass",
        npmDeps: [],
        source: {
          component: "src/system/recipes/Hero/Hero.tsx",
          styles: [],
          dependencies: ["src/system/atoms/Button/Button.tsx"],
          tokens: [],
        },
      }),
    ]
    const result = resolveDependencies(resolved)
    assert.ok(result.conflicts.length > 0)
    assert.match(result.conflicts[0], /Button/)
  })

  it("aggregates npm dependencies across sections", () => {
    const resolved = [
      makeResolved({
        id: "sidebar-glass-gsap:pro-sidebar",
        candidate: "sidebar-glass-gsap",
        npmDeps: ["@heroicons/react"],
        source: {
          component: "src/system/recipes/ProSidebar/ProSidebar.tsx",
          styles: [],
          dependencies: [],
          tokens: [],
        },
      }),
      makeResolved({
        id: "sidebar-glass-gsap:home-hero",
        candidate: "sidebar-glass-gsap",
        npmDeps: [],
        source: {
          component: "src/system/recipes/HomeHero/HomeHero.tsx",
          styles: [],
          dependencies: [],
          tokens: [],
        },
      }),
    ]
    const result = resolveDependencies(resolved)
    assert.equal(result.npmDeps.length, 1)
    assert.ok(result.npmDeps.includes("@heroicons/react"))
  })

  it("deduplicates npm dependencies", () => {
    const resolved = [
      makeResolved({
        id: "section:a",
        candidate: "sidebar-glass-gsap",
        npmDeps: ["@heroicons/react"],
        source: { component: "x.tsx", styles: [], dependencies: [], tokens: [] },
      }),
      makeResolved({
        id: "section:b",
        candidate: "sidebar-glass-gsap",
        npmDeps: ["@heroicons/react"],
        source: { component: "y.tsx", styles: [], dependencies: [], tokens: [] },
      }),
    ]
    const result = resolveDependencies(resolved)
    assert.equal(result.npmDeps.length, 1)
  })

  it("aggregates and deduplicates token paths", () => {
    const resolved = [
      makeResolved({
        id: "section:a",
        candidate: "sidebar-glass-gsap",
        npmDeps: [],
        source: {
          component: "x.tsx",
          styles: [],
          dependencies: [],
          tokens: ["src/styles/tokens/primitives.css", "src/styles/tokens/semantic.css"],
        },
      }),
      makeResolved({
        id: "section:b",
        candidate: "sidebar-glass-gsap",
        npmDeps: [],
        source: {
          component: "y.tsx",
          styles: [],
          dependencies: [],
          tokens: ["src/styles/tokens/primitives.css", "src/styles/tokens/treatments.css"],
        },
      }),
    ]
    const result = resolveDependencies(resolved)
    assert.equal(result.tokens.length, 3)
  })

  it("ignores non-atom paths in dependencies", () => {
    const resolved = [
      makeResolved({
        id: "sidebar-glass-gsap:location-map",
        candidate: "sidebar-glass-gsap",
        npmDeps: [],
        source: {
          component: "src/system/recipes/LocationContent/LocationContent.tsx",
          styles: [],
          // src/data/site.ts is NOT an atom path — should be ignored by atom detection
          dependencies: ["src/data/site.ts", "src/system/atoms/Button/Button.tsx"],
          tokens: [],
        },
      }),
    ]
    const result = resolveDependencies(resolved)
    assert.equal(result.atoms.length, 1)
    assert.equal(result.atoms[0].name, "Button")
  })

  it("handles sections with no dependencies", () => {
    const resolved = [
      makeResolved({
        id: "section:empty",
        candidate: "sidebar-glass-gsap",
        npmDeps: [],
        source: { component: "x.tsx", styles: [], dependencies: [], tokens: [] },
      }),
    ]
    const result = resolveDependencies(resolved)
    assert.equal(result.atoms.length, 0)
    assert.equal(result.npmDeps.length, 0)
    assert.equal(result.tokens.length, 0)
    assert.equal(result.conflicts.length, 0)
  })

  it("handles missing npmDeps field gracefully", () => {
    const resolved = [
      makeResolved({
        id: "section:no-npm-key",
        candidate: "sidebar-glass-gsap",
        // npmDeps intentionally absent
        source: { component: "x.tsx", styles: [], dependencies: [], tokens: [] },
      }),
    ]
    const result = resolveDependencies(resolved)
    assert.equal(result.npmDeps.length, 0)
  })
})
