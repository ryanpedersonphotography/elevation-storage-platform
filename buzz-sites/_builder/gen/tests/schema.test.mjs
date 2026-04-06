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
    assert.equal(result.data.sections[0].content.title, "Hero")
  })

  it("sanitizes HTML in meta.title", () => {
    const config = {
      name: "test",
      baseCandidate: "sidebar-glass-gsap",
      meta: { title: "<script>alert(1)</script>My Site" },
      sections: [{ registryId: "sidebar-glass-gsap:home-hero", content: {} }],
    }
    const result = validateConfig(config)
    assert.equal(result.success, true)
    assert.equal(result.data.meta.title, "My Site")
  })

  it("sanitizes HTML in meta.description", () => {
    const config = {
      name: "test",
      baseCandidate: "sidebar-glass-gsap",
      meta: {
        title: "Plain title",
        description: "<style>body{display:none}</style>Hello <b>world</b>",
      },
      sections: [{ registryId: "sidebar-glass-gsap:home-hero", content: {} }],
    }
    const result = validateConfig(config)
    assert.equal(result.success, true)
    assert.equal(result.data.meta.description, "Hello world")
  })

  it("leaves meta untouched when not provided", () => {
    const config = {
      name: "test",
      baseCandidate: "sidebar-glass-gsap",
      sections: [{ registryId: "sidebar-glass-gsap:home-hero", content: {} }],
    }
    const result = validateConfig(config)
    assert.equal(result.success, true)
    assert.equal(result.data.meta, undefined)
  })

  it("preserves undefined meta fields after sanitization", () => {
    const config = {
      name: "test",
      baseCandidate: "sidebar-glass-gsap",
      meta: { title: "Just a title" },
      sections: [{ registryId: "sidebar-glass-gsap:home-hero", content: {} }],
    }
    const result = validateConfig(config)
    assert.equal(result.success, true)
    assert.equal(result.data.meta.title, "Just a title")
    assert.equal(result.data.meta.description, undefined)
  })
})
