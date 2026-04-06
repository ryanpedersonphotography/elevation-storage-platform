/**
 * package.json aggregator.
 *
 * Builds a complete package.json for the generated Next.js project by merging
 * a fixed set of base dependencies with the npm packages declared by the
 * resolved sections.
 *
 * Pinned versions live in KNOWN_DEPS. Anything else falls back to "latest".
 */

/** Base dependencies every generated project gets. */
const BASE_DEPS = {
  next: "16.1.1",
  react: "19.2.3",
  "react-dom": "19.2.3",
}

/** Base devDependencies every generated project gets. */
const BASE_DEV_DEPS = {
  "@types/node": "^20",
  "@types/react": "^19",
  "@types/react-dom": "^19",
  typescript: "^5",
}

/** Pinned versions for known section dependencies. */
const KNOWN_DEPS = {
  "@heroicons/react": "^2.2.0",
  "framer-motion": "^11.0.0",
  gsap: "^3.12.0",
  "@gsap/react": "^2.1.0",
}

/**
 * Generate the package.json object for the output project.
 * @param {object} config        The validated page config (uses `name`)
 * @param {string[]} npmDeps     Array of npm package names from the dep graph
 * @returns {object}
 */
export function generatePackageJson(config, npmDeps) {
  const dependencies = { ...BASE_DEPS }
  for (const dep of npmDeps) {
    if (dep in KNOWN_DEPS) {
      dependencies[dep] = KNOWN_DEPS[dep]
    } else {
      // Unknown dep — fall back to "latest" but still include it.
      dependencies[dep] = "latest"
    }
  }

  // Sort deps alphabetically for stable output
  const sortedDeps = Object.fromEntries(
    Object.entries(dependencies).sort(([a], [b]) => a.localeCompare(b))
  )

  return {
    name: config.name,
    version: "0.1.0",
    private: true,
    scripts: {
      dev: "next dev",
      build: "next build",
      start: "next start",
    },
    dependencies: sortedDeps,
    devDependencies: { ...BASE_DEV_DEPS },
  }
}

/**
 * Generate the tsconfig.json contents (matches sidebar-glass-gsap conventions).
 * @returns {object}
 */
export function generateTsConfig() {
  return {
    compilerOptions: {
      target: "ES2017",
      lib: ["dom", "dom.iterable", "esnext"],
      allowJs: true,
      skipLibCheck: true,
      strict: true,
      noEmit: true,
      esModuleInterop: true,
      module: "esnext",
      moduleResolution: "bundler",
      resolveJsonModule: true,
      isolatedModules: true,
      jsx: "preserve",
      incremental: true,
      plugins: [{ name: "next" }],
      paths: {
        "@/*": ["./src/*"],
      },
    },
    include: ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
    exclude: ["node_modules"],
  }
}

/**
 * Generate the next.config.mjs file source as a string.
 * Kept minimal — projects can be extended after generation if needed.
 * @returns {string}
 */
export function generateNextConfig() {
  return `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
}

export default nextConfig
`
}
