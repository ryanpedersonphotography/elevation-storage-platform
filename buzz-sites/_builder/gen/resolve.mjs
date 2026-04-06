/**
 * Section resolver: looks up section IDs from a page config in the registry,
 * validates phase/complexity, and returns resolved sections with their content.
 *
 * Errors are returned for:
 *   - Unknown registry IDs
 *   - Sections marked as `requires-rewrite` (cannot be auto-extracted)
 *
 * Warnings are returned for:
 *   - Sections in phases beyond v1/v1.5 that are not requires-rewrite
 */

/**
 * @typedef {Object} ConfigSection
 * @property {string} registryId
 * @property {Object} [content]
 * @property {Object} [config]
 * @property {string} [id]
 */

/**
 * @typedef {Object} RegistryEntry
 * @property {string} id
 * @property {string} candidate
 * @property {string} name
 * @property {string} phase
 * @property {boolean} extractable
 * @property {string} extractionComplexity
 * @property {{ component: string, styles: string[], dependencies: string[], tokens: string[] }} source
 * @property {string[]} [npmDeps]
 */

/**
 * @typedef {Object} ResolvedSection
 * @property {RegistryEntry} entry
 * @property {Object} content
 * @property {Object} config
 * @property {string|undefined} sectionId
 * @property {boolean} preExtracted
 */

/**
 * @typedef {Object} ResolveResult
 * @property {ResolvedSection[]} resolved
 * @property {string[]} errors
 * @property {string[]} warnings
 */

/**
 * Resolve config sections against the registry.
 *
 * When `options.baseCandidate` is provided, all resolved sections are
 * validated to come from that candidate — V1 enforces a single-candidate
 * constraint because cross-candidate token systems cannot be merged safely.
 * V1.5+ will relax this via explicit bridging rules.
 *
 * @param {ConfigSection[]} configSections
 * @param {RegistryEntry[]} registry
 * @param {{ baseCandidate?: string }} [options]
 * @returns {ResolveResult}
 */
export function resolveSections(configSections, registry, options = {}) {
  const errors = []
  const warnings = []
  const resolved = []
  const { baseCandidate } = options

  for (const section of configSections) {
    const entry = registry.find((r) => r.id === section.registryId)
    if (!entry) {
      errors.push(`Section "${section.registryId}" not found in registry`)
      continue
    }

    if (entry.extractionComplexity === "requires-rewrite") {
      errors.push(
        `Section "${section.registryId}" requires a framework rewrite and cannot be extracted automatically.`
      )
      continue
    }

    if (baseCandidate && entry.candidate !== baseCandidate) {
      errors.push(
        `Section "${section.registryId}" belongs to candidate "${entry.candidate}" but baseCandidate is "${baseCandidate}". V1 does not support mixing sections from multiple candidates.`
      )
      continue
    }

    if (entry.phase !== "v1" && entry.phase !== "v1.5") {
      warnings.push(
        `Section "${section.registryId}" is phase ${entry.phase} — not V1-ready. Extraction may fail.`
      )
    }

    // Validate content keys against contentSlots — a user can write content
    // keys that the underlying component does not accept; without this guard
    // the generator would dutifully pass them as JSX props and the generated
    // page.tsx would fail TypeScript compilation.
    const contentSlots = entry.contentSlots ?? {}
    const allowedContentKeys = Object.keys(contentSlots)
    const providedContentKeys = Object.keys(section.content ?? {})
    const unknownContentKeys = providedContentKeys.filter(
      (k) => !allowedContentKeys.includes(k)
    )
    if (unknownContentKeys.length > 0) {
      const allowedDescription =
        allowedContentKeys.length > 0
          ? allowedContentKeys.join(", ")
          : "(none — section has no content slots)"
      errors.push(
        `Section "${section.registryId}" was given content keys [${unknownContentKeys.join(", ")}] but only accepts [${allowedDescription}]. Either remove these keys from the config, or this section needs to be pre-extracted with a prop-driven interface.`
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
