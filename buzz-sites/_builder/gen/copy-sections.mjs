/**
 * File copier for sections, atoms, and tokens.
 *
 * Copies source files into the temporary output directory in the structure:
 *   {outputDir}/src/system/recipes/<Name>/    (sections — both ready & pre-extracted)
 *   {outputDir}/src/system/atoms/             (all atoms from base candidate)
 *   {outputDir}/src/system/utils/             (cx and helpers)
 *   {outputDir}/src/styles/tokens/            (token files)
 *   {outputDir}/src/styles/reset.css
 *   {outputDir}/src/styles/layout-utilities.css
 *   {outputDir}/src/data/site.ts              (only if any section needs it)
 *
 * For "ready" sections, source = candidates/<candidate>/<dirname(component)>/
 * For "requires-refactor" sections, source = _builder/extracted/<Name>/
 *
 * All source paths are checked with validateSourcePath before any I/O.
 */

import { cp, mkdir, readdir } from "node:fs/promises"
import { existsSync } from "node:fs"
import { basename, dirname, join, resolve } from "node:path"
import { validateSourcePath } from "./validate-paths.mjs"

/** Files that should never be copied into a generated project. */
const COPY_BLOCKLIST = new Set([".DS_Store", "Thumbs.db", ".git"])

/**
 * Filter function for cp() that skips OS metadata files.
 * @param {string} src
 * @returns {boolean}
 */
function copyFilter(src) {
  return !COPY_BLOCKLIST.has(basename(src))
}

/**
 * @typedef {import("./resolve.mjs").ResolvedSection} ResolvedSection
 * @typedef {import("./resolve-deps.mjs").DepGraph} DepGraph
 */

/**
 * @typedef {Object} CopyContext
 * @property {string} repoRoot       Absolute path to the buzz-sites repo root
 * @property {string} outputDir      Absolute path to the (temp) output directory
 * @property {string} baseCandidate  Name of the base candidate (e.g. "sidebar-glass-gsap")
 */

/**
 * Build the destination layout and copy all required files.
 * @param {ResolvedSection[]} resolvedSections
 * @param {DepGraph} depGraph
 * @param {CopyContext} ctx
 * @returns {Promise<{ filesCopied: number }>}
 */
export async function copySections(resolvedSections, depGraph, ctx) {
  const { repoRoot, outputDir, baseCandidate } = ctx
  const candidateRoot = resolve(repoRoot, "candidates", baseCandidate)
  const extractedRoot = resolve(repoRoot, "_builder/extracted")

  let filesCopied = 0

  // 1. Ensure output skeleton exists
  await mkdir(join(outputDir, "src/app"), { recursive: true })
  await mkdir(join(outputDir, "src/system/recipes"), { recursive: true })
  await mkdir(join(outputDir, "src/system/atoms"), { recursive: true })
  await mkdir(join(outputDir, "src/system/utils"), { recursive: true })
  await mkdir(join(outputDir, "src/styles/tokens"), { recursive: true })

  // 2. Copy each resolved section.
  //    Atom-tier sections are skipped here — they ride along in the bulk
  //    atoms copy in step 3, and assemblePage imports them from @/system/atoms/.
  for (const section of resolvedSections) {
    if (section.entry.tier === "atom") continue

    const name = section.entry.name
    const dest = join(outputDir, "src/system/recipes", name)

    if (section.preExtracted) {
      // Source: _builder/extracted/<Name>/
      const src = join(extractedRoot, name)
      if (!existsSync(src)) {
        throw new Error(
          `Pre-extracted section directory not found: ${src} (for ${section.entry.id})`
        )
      }
      await cp(src, dest, { recursive: true, errorOnExist: false, filter: copyFilter })
      filesCopied += await countFiles(dest)
    } else {
      // Source: candidates/<candidate>/<dirname(component)>/
      // Always validate the path first to prevent traversal
      const componentPath = section.entry.source.component
      const pathCheck = validateSourcePath(componentPath, candidateRoot)
      if (!pathCheck.valid) {
        throw new Error(
          `Invalid component path for ${section.entry.id}: ${pathCheck.reason}`
        )
      }
      const srcDir = dirname(pathCheck.resolved)
      if (!existsSync(srcDir)) {
        throw new Error(
          `Source recipe directory not found: ${srcDir} (for ${section.entry.id})`
        )
      }
      await cp(srcDir, dest, { recursive: true, errorOnExist: false, filter: copyFilter })
      filesCopied += await countFiles(dest)
    }
  }

  // 2b. Copy transitive recipe dependencies for pre-extracted sections.
  //     Pre-extracted components may still import from @/system/recipes/*
  //     (e.g. SettingSection imports PageSection). Walk their declared
  //     dependency list and copy any recipe directory we haven't already.
  const copiedRecipes = new Set(
    resolvedSections
      .filter((s) => s.entry.tier !== "atom")
      .map((s) => s.entry.name)
  )
  for (const section of resolvedSections) {
    if (section.entry.tier === "atom") continue
    for (const depPath of section.entry.source?.dependencies ?? []) {
      const match = depPath.match(/recipes\/([^/]+)\//)
      if (!match) continue
      const recipeName = match[1]
      if (copiedRecipes.has(recipeName)) continue

      const pathCheck = validateSourcePath(depPath, candidateRoot)
      if (!pathCheck.valid) {
        throw new Error(
          `Invalid recipe dependency path for ${section.entry.id}: ${pathCheck.reason}`
        )
      }
      const srcDir = dirname(pathCheck.resolved)
      if (!existsSync(srcDir)) continue

      const dest = join(outputDir, "src/system/recipes", recipeName)
      await cp(srcDir, dest, { recursive: true, errorOnExist: false, filter: copyFilter })
      copiedRecipes.add(recipeName)
      filesCopied += await countFiles(dest)
    }
  }

  // 3. Copy ALL atoms from the base candidate.
  // Rationale: recipes import many layout atoms (Stack, Cluster, Box, Heading,
  // Text, Grid) that are not declared in registry dependencies. Copying the
  // whole atoms directory is safer and the directory is small. The dependency
  // graph still detects conflicts and aggregates explicit deps.
  const atomsSrc = join(candidateRoot, "src/system/atoms")
  if (existsSync(atomsSrc)) {
    const atomsDest = join(outputDir, "src/system/atoms")
    await cp(atomsSrc, atomsDest, { recursive: true, errorOnExist: false, filter: copyFilter })
    filesCopied += await countFiles(atomsDest)
  }

  // 4. Copy system/utils (cx and friends)
  const utilsSrc = join(candidateRoot, "src/system/utils")
  if (existsSync(utilsSrc)) {
    const utilsDest = join(outputDir, "src/system/utils")
    await cp(utilsSrc, utilsDest, { recursive: true, errorOnExist: false, filter: copyFilter })
    filesCopied += await countFiles(utilsDest)
  }

  // 5. Copy ALL token files from the base candidate (token system is monolithic)
  const tokensSrc = join(candidateRoot, "src/styles/tokens")
  if (existsSync(tokensSrc)) {
    const tokensDest = join(outputDir, "src/styles/tokens")
    await cp(tokensSrc, tokensDest, { recursive: true, errorOnExist: false, filter: copyFilter })
    filesCopied += await countFiles(tokensDest)
  }

  // 6. Copy reset.css and layout-utilities.css (always required)
  for (const styleFile of ["reset.css", "layout-utilities.css"]) {
    const styleCheck = validateSourcePath(`src/styles/${styleFile}`, candidateRoot)
    if (!styleCheck.valid) {
      throw new Error(`Invalid style path for ${styleFile}: ${styleCheck.reason}`)
    }
    if (existsSync(styleCheck.resolved)) {
      const dest = join(outputDir, "src/styles", styleFile)
      await cp(styleCheck.resolved, dest)
      filesCopied += 1
    }
  }

  // 7. Copy data/site.ts if any section needs it (LocationContent does)
  const needsSiteData = resolvedSections.some((s) =>
    (s.entry.source?.dependencies ?? []).some((dep) => dep.startsWith("src/data/"))
  )
  if (needsSiteData) {
    const dataSrc = join(candidateRoot, "src/data")
    if (existsSync(dataSrc)) {
      const dataDest = join(outputDir, "src/data")
      await mkdir(dataDest, { recursive: true })
      await cp(dataSrc, dataDest, { recursive: true, errorOnExist: false, filter: copyFilter })
      filesCopied += await countFiles(dataDest)
    }
  }

  // 8. Copy ambient type declarations from src/types if present.
  //    sidebar-glass-gsap ships an augmentation that teaches React's
  //    CSSProperties to accept `--custom-prop` keys — without it, every
  //    atom and recipe that sets CSS variables via style={{}} fails to
  //    type-check.
  const typesSrc = join(candidateRoot, "src/types")
  if (existsSync(typesSrc)) {
    const typesDest = join(outputDir, "src/types")
    await mkdir(typesDest, { recursive: true })
    await cp(typesSrc, typesDest, { recursive: true, errorOnExist: false, filter: copyFilter })
    filesCopied += await countFiles(typesDest)
  }

  return { filesCopied }
}

/**
 * Count all files (not directories) recursively under a path.
 * Used for reporting only — not load-bearing.
 * @param {string} dirPath
 * @returns {Promise<number>}
 */
async function countFiles(dirPath) {
  let total = 0
  try {
    const entries = await readdir(dirPath, { withFileTypes: true })
    for (const entry of entries) {
      const full = join(dirPath, entry.name)
      if (entry.isDirectory()) {
        total += await countFiles(full)
      } else {
        total += 1
      }
    }
  } catch {
    // ignore — counter is best-effort
  }
  return total
}
