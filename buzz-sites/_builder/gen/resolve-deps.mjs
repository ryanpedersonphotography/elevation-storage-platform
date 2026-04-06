/**
 * Dependency graph builder.
 *
 * Walks the resolved sections and produces:
 *   - `atoms`: deduplicated in-tree atom dependencies (with usage tracking)
 *   - `npmDeps`: deduplicated npm package names
 *   - `tokens`: deduplicated token file paths (prefixed by candidate)
 *   - `conflicts`: human-readable strings describing atom collisions
 *
 * An "atom" is detected by the path pattern `atoms/<Name>/`. The atom is
 * uniquely keyed by name only (not full path), so two sections that depend
 * on the same `Button.tsx` from the same candidate dedupe cleanly. If two
 * candidates each provide a different `Button.tsx`, that is reported as a
 * conflict because the output project can only have one Button atom.
 */

/**
 * @typedef {import("./resolve.mjs").ResolvedSection} ResolvedSection
 */

/**
 * @typedef {Object} AtomInfo
 * @property {string} name
 * @property {string} sourcePath  Full path including candidate prefix
 * @property {string} candidate
 * @property {string} relativePath Path within the candidate (no prefix)
 * @property {string[]} usedBy  Section IDs that depend on this atom
 */

/**
 * @typedef {Object} DepGraph
 * @property {AtomInfo[]} atoms
 * @property {string[]} npmDeps
 * @property {string[]} tokens
 * @property {string[]} conflicts
 */

/**
 * Build a dependency graph from a list of resolved sections.
 * @param {ResolvedSection[]} resolvedSections
 * @returns {DepGraph}
 */
export function resolveDependencies(resolvedSections) {
  /** @type {Map<string, AtomInfo>} */
  const atoms = new Map()
  /** @type {Set<string>} */
  const npmDeps = new Set()
  /** @type {Set<string>} */
  const tokens = new Set()
  /** @type {string[]} */
  const conflicts = []

  for (const { entry } of resolvedSections) {
    // Aggregate npm deps
    for (const dep of entry.npmDeps ?? []) {
      npmDeps.add(dep)
    }

    // Aggregate token paths (prefixed by candidate so duplicates from
    // different candidates remain distinct on disk)
    for (const tokenPath of entry.source?.tokens ?? []) {
      tokens.add(`${entry.candidate}/${tokenPath}`)
    }

    // Walk in-tree dependencies and pick out atoms
    for (const depPath of entry.source?.dependencies ?? []) {
      // Match: …/atoms/<AtomName>/<file>
      const match = depPath.match(/atoms\/([^/]+)\//)
      if (!match) continue
      const atomName = match[1]
      const fullPath = `${entry.candidate}/${depPath}`

      const existing = atoms.get(atomName)
      if (existing) {
        if (existing.sourcePath !== fullPath) {
          conflicts.push(
            `Atom "${atomName}" has conflicting implementations: ${existing.sourcePath} vs ${fullPath}`
          )
        }
        if (!existing.usedBy.includes(entry.id)) {
          existing.usedBy.push(entry.id)
        }
      } else {
        atoms.set(atomName, {
          name: atomName,
          sourcePath: fullPath,
          candidate: entry.candidate,
          relativePath: depPath,
          usedBy: [entry.id],
        })
      }
    }
  }

  return {
    atoms: Array.from(atoms.values()),
    npmDeps: Array.from(npmDeps),
    tokens: Array.from(tokens),
    conflicts,
  }
}
