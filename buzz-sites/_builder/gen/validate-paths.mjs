import { realpathSync } from "node:fs"
import { resolve, isAbsolute, relative } from "node:path"

export function validateSourcePath(sourcePath, candidateRoot) {
  if (isAbsolute(sourcePath)) {
    return { valid: false, reason: "Absolute paths not allowed" }
  }
  if (sourcePath.includes("..")) {
    return { valid: false, reason: `Path traversal detected: ${sourcePath}` }
  }
  const resolved = resolve(candidateRoot, sourcePath)
  const rel = relative(candidateRoot, resolved)
  if (rel.startsWith("..")) {
    return { valid: false, reason: `Path escapes candidate directory: ${sourcePath}` }
  }

  // Symlink resolution: if the path (or any of its ancestors) is a symlink
  // that points outside the candidate root, reject it. realpathSync throws
  // if the file doesn't exist — that's fine because the string-based checks
  // above already verified the declared path is safe.
  try {
    const realResolved = realpathSync(resolved)
    const realRoot = realpathSync(candidateRoot)
    const realRel = relative(realRoot, realResolved)
    if (realRel.startsWith("..") || isAbsolute(realRel)) {
      return { valid: false, reason: `Symlink escapes candidate directory: ${sourcePath}` }
    }
  } catch {
    // Path doesn't exist yet — string check above is sufficient.
  }

  return { valid: true, resolved }
}

export function validateRegistryPaths(entry, candidatesRoot) {
  const errors = []
  const root = resolve(candidatesRoot, entry.candidate)
  const paths = [
    entry.source.component,
    ...entry.source.styles,
    ...entry.source.dependencies,
    ...entry.source.tokens,
  ]
  for (const p of paths) {
    const result = validateSourcePath(p, root)
    if (!result.valid) {
      errors.push(`${entry.id}: ${result.reason}`)
    }
  }
  return errors
}
