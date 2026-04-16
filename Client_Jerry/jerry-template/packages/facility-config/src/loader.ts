import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { FacilityConfigSchema } from './schema'
import type { FacilityConfig } from './types'

// ─── Data directory resolution ───
// Searches upward from cwd for `data/facilities/` to work from any package directory

function findDataDir(): string {
  let dir = process.cwd()
  const root = dirname(dir)
  while (dir !== root) {
    const candidate = join(dir, 'data', 'facilities')
    if (existsSync(candidate)) {
      return candidate
    }
    dir = dirname(dir)
  }
  // Fallback: assume standard monorepo layout from package dir
  return join(process.cwd(), '..', '..', 'data', 'facilities')
}

let _dataDir: string | undefined

function getDataDir(): string {
  if (!_dataDir) {
    _dataDir = findDataDir()
  }
  return _dataDir
}

/** Override the data directory (useful for testing) */
export function setDataDir(dir: string): void {
  _dataDir = dir
}

/** Reset data directory to auto-detect (useful for testing) */
export function resetDataDir(): void {
  _dataDir = undefined
}

// ─── Loaders ───

/**
 * Load and validate a single facility config by slug.
 * Throws if the file does not exist or fails validation.
 */
export function loadFacility(slug: string): FacilityConfig {
  const dataDir = getDataDir()
  const filePath = join(dataDir, `${slug}.json`)

  if (!existsSync(filePath)) {
    throw new Error(
      `Facility config not found: ${filePath}\n` +
        `Ensure data/facilities/${slug}.json exists.`
    )
  }

  const raw = readFileSync(filePath, 'utf-8')
  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch (e) {
    throw new Error(`Invalid JSON in ${filePath}: ${(e as Error).message}`)
  }

  const result = FacilityConfigSchema.safeParse(data)
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n')
    throw new Error(`Validation failed for ${slug}:\n${issues}`)
  }

  return result.data
}

/**
 * Load and validate all facility configs from data/facilities/.
 * Returns an array of validated configs. Throws on first validation error.
 */
export function loadAllFacilities(): FacilityConfig[] {
  const dataDir = getDataDir()

  if (!existsSync(dataDir)) {
    throw new Error(`Data directory not found: ${dataDir}`)
  }

  const files = readdirSync(dataDir).filter((f) => f.endsWith('.json'))

  if (files.length === 0) {
    throw new Error(`No facility JSON files found in ${dataDir}`)
  }

  return files.map((file) => {
    const slug = file.replace(/\.json$/, '')
    return loadFacility(slug)
  })
}

/**
 * Load all facilities with deployment.mode === 'subdirectory'.
 * Used by the umbrella site to discover which facilities to render.
 */
export function loadSubdirectoryFacilities(): FacilityConfig[] {
  return loadAllFacilities().filter((f) => f.deployment.mode === 'subdirectory')
}
