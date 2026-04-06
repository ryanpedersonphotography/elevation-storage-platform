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
})
