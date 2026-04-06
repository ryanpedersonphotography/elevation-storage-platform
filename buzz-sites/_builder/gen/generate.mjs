#!/usr/bin/env node
/**
 * Landing page generator CLI entry point.
 *
 * Usage:
 *   node generate.mjs --config <path> [--out <dir>]
 *   node generate.mjs --validate <path>
 *   node generate.mjs --list-sections
 */

import { parseArgs } from "node:util"
import { readFileSync } from "node:fs"
import { mkdir, rename, rm, writeFile } from "node:fs/promises"
import { fileURLToPath } from "node:url"
import { dirname, isAbsolute, resolve, basename } from "node:path"

import { validateConfig } from "./schema.mjs"
import { validateRegistryPaths } from "./validate-paths.mjs"
import { resolveSections } from "./resolve.mjs"
import { resolveDependencies } from "./resolve-deps.mjs"
import { copySections } from "./copy-sections.mjs"
import { assemblePage, writeFormApiRoutes } from "./assemble.mjs"
import {
  generatePackageJson,
  generateTsConfig,
  generateNextConfig,
} from "./aggregate-npm.mjs"

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(__dirname, "../..")
const REGISTRY_PATH = resolve(__dirname, "../registry/sections.json")

const { values } = parseArgs({
  options: {
    config: { type: "string", short: "c" },
    out: { type: "string", short: "o", default: "dist" },
    validate: { type: "string" },
    "list-sections": { type: "boolean" },
  },
  allowPositionals: false,
})

// ── --list-sections ────────────────────────────────────────────────────────
if (values["list-sections"]) {
  listSections()
  process.exit(0)
}

// ── --validate <path> ──────────────────────────────────────────────────────
if (values.validate) {
  const code = await runValidate(values.validate)
  process.exit(code)
}

// ── No --config: print usage ───────────────────────────────────────────────
if (!values.config) {
  printUsage()
  process.exit(1)
}

// ── Generate ───────────────────────────────────────────────────────────────
const exitCode = await runGenerate(values.config, values.out)
process.exit(exitCode)

// ════════════════════════════════════════════════════════════════════════════
// Commands
// ════════════════════════════════════════════════════════════════════════════

function listSections() {
  const sections = JSON.parse(readFileSync(REGISTRY_PATH, "utf8"))
  const listed = sections.filter(
    (s) => s.phase === "v1" || s.phase === "v1.5"
  )

  const COL_ID = 40
  const COL_PHASE = 8
  const COL_ARCH = 14
  const COL_STATUS = 12

  const pad = (str, len) => String(str).padEnd(len)
  const header = `${pad("ID", COL_ID)}${pad("PHASE", COL_PHASE)}${pad("ARCHETYPE", COL_ARCH)}STATUS`
  const divider = "-".repeat(COL_ID + COL_PHASE + COL_ARCH + COL_STATUS)

  console.log(`\nV1/V1.5 sections (${listed.length} total)\n`)
  console.log(header)
  console.log(divider)

  for (const s of listed) {
    const ready = s.extractable && s.selfContained
    const status = ready ? "READY" : "NEEDS WORK"
    console.log(
      `${pad(s.id, COL_ID)}${pad(s.phase, COL_PHASE)}${pad(s.archetype, COL_ARCH)}${status}`
    )
  }

  console.log("")
}

async function runValidate(configPath) {
  console.log(`Validating ${configPath}...`)

  const result = await loadAndResolve(configPath)
  if (!result.ok) {
    for (const err of result.errors) console.error(`  ERROR: ${err}`)
    return 1
  }

  console.log(`  Config valid`)
  console.log(`  Sections resolved: ${result.resolved.length}`)
  console.log(`  Atoms required:    ${result.depGraph.atoms.length}`)
  console.log(`  npm packages:      ${result.depGraph.npmDeps.length}`)
  console.log(`  Token files:       ${result.depGraph.tokens.length}`)

  if (result.warnings.length > 0) {
    console.log(`\n  Warnings:`)
    for (const w of result.warnings) console.log(`    - ${w}`)
  }

  if (result.depGraph.conflicts.length > 0) {
    console.error(`\n  Conflicts:`)
    for (const c of result.depGraph.conflicts) console.error(`    - ${c}`)
    return 1
  }

  return 0
}

async function runGenerate(configPath, outDirArg) {
  console.log(`Generating from ${configPath}...`)

  const result = await loadAndResolve(configPath)
  if (!result.ok) {
    for (const err of result.errors) console.error(`  ERROR: ${err}`)
    return 1
  }

  if (result.depGraph.conflicts.length > 0) {
    console.error(`\n  Atom conflicts detected:`)
    for (const c of result.depGraph.conflicts) console.error(`    - ${c}`)
    return 1
  }

  for (const w of result.warnings) console.warn(`  warn: ${w}`)

  const finalOutDir = isAbsolute(outDirArg)
    ? outDirArg
    : resolve(process.cwd(), outDirArg)

  // Atomic write strategy:
  // Build into a sibling .tmp directory inside the same parent so `rename` is
  // an atomic same-filesystem move on macOS/Linux.
  const parent = dirname(finalOutDir)
  const tempName = `.tmp-${basename(finalOutDir)}-${Date.now()}`
  const tempDir = resolve(parent, tempName)

  try {
    await mkdir(parent, { recursive: true })
    await mkdir(tempDir, { recursive: true })

    // 1. Copy section files, atoms, tokens, etc.
    const { filesCopied } = await copySections(result.resolved, result.depGraph, {
      repoRoot: REPO_ROOT,
      outputDir: tempDir,
      baseCandidate: result.config.baseCandidate,
    })

    // 2. Assemble page.tsx, layout.tsx, globals.css
    await assemblePage(result.resolved, result.config, tempDir)

    // 2b. Emit API route stubs for form sections (e.g. /api/schedule-tour)
    const apiRoutes = await writeFormApiRoutes(result.resolved, tempDir)

    // 3. Write package.json, tsconfig.json, next.config.mjs
    const pkg = generatePackageJson(result.config, result.depGraph.npmDeps)
    await writeFile(
      resolve(tempDir, "package.json"),
      JSON.stringify(pkg, null, 2) + "\n",
      "utf8"
    )

    const tsconfig = generateTsConfig()
    await writeFile(
      resolve(tempDir, "tsconfig.json"),
      JSON.stringify(tsconfig, null, 2) + "\n",
      "utf8"
    )

    await writeFile(
      resolve(tempDir, "next.config.mjs"),
      generateNextConfig(),
      "utf8"
    )

    // 4. Atomic move temp → final
    // Remove the existing target first if it exists, since rename won't
    // overwrite a non-empty directory.
    await rm(finalOutDir, { recursive: true, force: true })
    await rename(tempDir, finalOutDir)

    console.log(`\n  Generated: ${finalOutDir}`)
    console.log(`  Files copied: ${filesCopied}`)
    console.log(`  Sections: ${result.resolved.length}`)
    console.log(`  Atoms detected: ${result.depGraph.atoms.length}`)
    console.log(`  npm deps: ${result.depGraph.npmDeps.length}`)
    if (apiRoutes.length > 0) {
      console.log(`  API routes: ${apiRoutes.join(", ")}`)
    }
    console.log(`\n  Next steps:`)
    console.log(`    cd ${finalOutDir}`)
    console.log(`    npm install`)
    console.log(`    npm run dev`)
    return 0
  } catch (err) {
    console.error(`\n  Generation failed: ${err.message}`)
    if (err.stack && process.env.DEBUG) console.error(err.stack)
    // Clean up temp dir on failure (atomic guarantee — leave no partial output)
    try {
      await rm(tempDir, { recursive: true, force: true })
    } catch {}
    return 2
  }
}

// ════════════════════════════════════════════════════════════════════════════
// Shared pipeline
// ════════════════════════════════════════════════════════════════════════════

/**
 * Load config + registry, run validation/resolution/dependency steps.
 * Returns a structured result for either --validate or full generation.
 */
async function loadAndResolve(configPath) {
  const errors = []

  // 1. Load and validate config
  let rawConfig
  try {
    rawConfig = JSON.parse(readFileSync(configPath, "utf8"))
  } catch (err) {
    return { ok: false, errors: [`Failed to read config: ${err.message}`] }
  }

  const parsed = validateConfig(rawConfig)
  if (!parsed.success) {
    const issues = parsed.error.issues.map(
      (i) => `${i.path.join(".") || "(root)"}: ${i.message}`
    )
    return { ok: false, errors: issues }
  }
  const config = parsed.data

  // 2. Load registry
  let registry
  try {
    registry = JSON.parse(readFileSync(REGISTRY_PATH, "utf8"))
  } catch (err) {
    return { ok: false, errors: [`Failed to read registry: ${err.message}`] }
  }

  // 3. Validate every registry entry's source paths (path traversal guard)
  const candidatesRoot = resolve(REPO_ROOT, "candidates")
  for (const entry of registry) {
    const pathErrors = validateRegistryPaths(entry, candidatesRoot)
    errors.push(...pathErrors)
  }
  if (errors.length > 0) {
    return { ok: false, errors }
  }

  // 4. Resolve sections (enforce single-candidate constraint)
  const { resolved, errors: resolveErrs, warnings } = resolveSections(
    config.sections,
    registry,
    { baseCandidate: config.baseCandidate }
  )
  if (resolveErrs.length > 0) {
    return { ok: false, errors: resolveErrs }
  }

  // 5. Build dependency graph
  const depGraph = resolveDependencies(resolved)

  return { ok: true, config, resolved, depGraph, warnings }
}

function printUsage() {
  console.error(`
Usage: node generate.mjs --config <path> [--out <dir>]
       node generate.mjs --validate <path>
       node generate.mjs --list-sections

Options:
  -c, --config <path>    Path to page config JSON (required for generation)
  -o, --out <dir>        Output directory (default: dist)
      --validate <path>  Validate a page config without writing anything
      --list-sections    List V1 and V1.5 sections and exit
`)
}
