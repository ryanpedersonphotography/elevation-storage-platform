#!/usr/bin/env bun
/**
 * CLI validation script for facility configs.
 * Reads all JSON files in data/facilities/ and validates against the Zod schema.
 * Exits with code 1 on any validation error.
 *
 * Usage: bun run src/validate.ts
 */

import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { FacilityConfigSchema } from './schema'

// Find data directory by searching upward
function findDataDir(): string {
  let dir = dirname(new URL(import.meta.url).pathname)
  const root = '/'
  // Walk up from this file's directory
  for (let i = 0; i < 10; i++) {
    dir = dirname(dir)
    const candidate = join(dir, 'data', 'facilities')
    if (existsSync(candidate)) {
      return candidate
    }
  }
  // Fallback
  return join(process.cwd(), 'data', 'facilities')
}

const dataDir = findDataDir()

if (!existsSync(dataDir)) {
  console.error(`\u274c Data directory not found: ${dataDir}`)
  process.exit(1)
}

const files = readdirSync(dataDir).filter((f) => f.endsWith('.json'))

if (files.length === 0) {
  console.error(`\u274c No facility JSON files found in ${dataDir}`)
  process.exit(1)
}

let hasErrors = false
let validCount = 0

for (const file of files) {
  const filePath = join(dataDir, file)
  const slug = file.replace(/\.json$/, '')

  let data: unknown
  try {
    const raw = readFileSync(filePath, 'utf-8')
    data = JSON.parse(raw)
  } catch (e) {
    console.error(`\u274c ${slug}: Invalid JSON — ${(e as Error).message}`)
    hasErrors = true
    continue
  }

  const result = FacilityConfigSchema.safeParse(data)
  if (!result.success) {
    console.error(`\u274c ${slug}: Validation failed`)
    for (const issue of result.error.issues) {
      console.error(`    ${issue.path.join('.')}: ${issue.message}`)
    }
    hasErrors = true
  } else {
    validCount++
    console.log(`\u2705 ${slug}: Valid (${Object.keys(result.data.pages).length} pages, ${result.data.data.units.length} units)`)
  }
}

console.log(`\nValidated ${files.length} file(s): ${validCount} passed, ${files.length - validCount} failed.`)

if (hasErrors) {
  process.exit(1)
}
