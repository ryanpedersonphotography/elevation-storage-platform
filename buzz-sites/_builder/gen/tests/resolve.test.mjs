import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { resolveSections } from "../resolve.mjs"

const MOCK_REGISTRY = [
  {
    id: "sidebar-glass-gsap:home-hero",
    candidate: "sidebar-glass-gsap",
    name: "HomeHero",
    phase: "v1",
    extractable: true,
    extractionComplexity: "ready",
    source: {
      component: "src/system/recipes/HomeHero/HomeHero.tsx",
      styles: [],
      dependencies: [],
      tokens: [],
    },
  },
  {
    id: "sidebar-glass-gsap:proof-band",
    candidate: "sidebar-glass-gsap",
    name: "ProofBand",
    phase: "v1",
    extractable: false,
    extractionComplexity: "requires-refactor",
    source: {
      component: "src/app/page.tsx",
      styles: [],
      dependencies: [],
      tokens: [],
    },
  },
  {
    id: "classic-clean:hero",
    candidate: "classic-clean",
    name: "Hero",
    phase: "v2",
    extractable: false,
    extractionComplexity: "requires-rewrite",
    source: {
      component: "src/pages/HomePage.jsx",
      styles: [],
      dependencies: [],
      tokens: [],
    },
  },
  {
    id: "sidebar-glass:future-section",
    candidate: "sidebar-glass",
    name: "FutureSection",
    phase: "v1.5",
    extractable: true,
    extractionComplexity: "ready",
    source: {
      component: "src/system/recipes/FutureSection/FutureSection.tsx",
      styles: [],
      dependencies: [],
      tokens: [],
    },
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

  it("rejects requires-rewrite sections as errors", () => {
    const result = resolveSections(
      [{ registryId: "classic-clean:hero", content: {} }],
      MOCK_REGISTRY
    )
    // V2 with requires-rewrite is an error, not just a warning
    assert.ok(result.errors.length > 0)
    assert.equal(result.resolved.length, 0)
  })

  it("flags requires-refactor sections as needing pre-extraction", () => {
    const result = resolveSections(
      [{ registryId: "sidebar-glass-gsap:proof-band", content: {} }],
      MOCK_REGISTRY
    )
    assert.equal(result.errors.length, 0)
    assert.equal(result.resolved.length, 1)
    assert.ok(result.resolved[0].preExtracted)
  })

  it("does not flag ready sections as preExtracted", () => {
    const result = resolveSections(
      [{ registryId: "sidebar-glass-gsap:home-hero", content: {} }],
      MOCK_REGISTRY
    )
    assert.equal(result.resolved[0].preExtracted, false)
  })

  it("accepts v1.5 sections without emitting a warning", () => {
    const result = resolveSections(
      [{ registryId: "sidebar-glass:future-section", content: {} }],
      MOCK_REGISTRY
    )
    // v1.5 is first-class — no errors and no warnings should be emitted
    assert.equal(result.errors.length, 0)
    assert.equal(result.warnings.length, 0)
    assert.equal(result.resolved.length, 1)
  })

  it("enforces single-candidate constraint when baseCandidate is provided", () => {
    const result = resolveSections(
      [
        { registryId: "sidebar-glass-gsap:home-hero", content: {} },
        { registryId: "sidebar-glass:future-section", content: {} },
      ],
      MOCK_REGISTRY,
      { baseCandidate: "sidebar-glass-gsap" }
    )
    // Only the sidebar-glass-gsap section should resolve; the foreign one errors
    assert.equal(result.resolved.length, 1)
    assert.equal(result.resolved[0].entry.candidate, "sidebar-glass-gsap")
    assert.equal(result.errors.length, 1)
    assert.match(result.errors[0], /baseCandidate/)
    assert.match(result.errors[0], /sidebar-glass:future-section/)
  })

  it("allows multiple sections from the same base candidate", () => {
    const result = resolveSections(
      [
        { registryId: "sidebar-glass-gsap:home-hero", content: {} },
        { registryId: "sidebar-glass-gsap:proof-band", content: {} },
      ],
      MOCK_REGISTRY,
      { baseCandidate: "sidebar-glass-gsap" }
    )
    assert.equal(result.errors.length, 0)
    assert.equal(result.resolved.length, 2)
  })

  it("preserves content, config, and section id from input", () => {
    const result = resolveSections(
      [
        {
          registryId: "sidebar-glass-gsap:home-hero",
          content: { title: "Hello" },
          config: { autoPlay: true },
          id: "hero-1",
        },
      ],
      MOCK_REGISTRY
    )
    assert.equal(result.resolved[0].content.title, "Hello")
    assert.equal(result.resolved[0].config.autoPlay, true)
    assert.equal(result.resolved[0].sectionId, "hero-1")
  })

  it("defaults missing content/config to empty objects", () => {
    const result = resolveSections(
      [{ registryId: "sidebar-glass-gsap:home-hero" }],
      MOCK_REGISTRY
    )
    assert.deepEqual(result.resolved[0].content, {})
    assert.deepEqual(result.resolved[0].config, {})
  })

  it("processes multiple sections in order", () => {
    const result = resolveSections(
      [
        { registryId: "sidebar-glass-gsap:home-hero", content: {} },
        { registryId: "sidebar-glass-gsap:proof-band", content: {} },
      ],
      MOCK_REGISTRY
    )
    assert.equal(result.resolved.length, 2)
    assert.equal(result.resolved[0].entry.id, "sidebar-glass-gsap:home-hero")
    assert.equal(result.resolved[1].entry.id, "sidebar-glass-gsap:proof-band")
  })

  it("collects multiple errors without short-circuiting", () => {
    const result = resolveSections(
      [
        { registryId: "nonexistent:one", content: {} },
        { registryId: "nonexistent:two", content: {} },
      ],
      MOCK_REGISTRY
    )
    assert.equal(result.errors.length, 2)
  })
})
