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
