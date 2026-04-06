/**
 * Page assembler.
 *
 * Generates the three top-level App Router files from the resolved page config:
 *   - src/app/page.tsx     — composed page that imports each section
 *   - src/app/layout.tsx   — root layout with fonts, theme, metadata
 *   - src/app/globals.css  — imports reset, tokens, layout utilities
 *
 * Also provides `writeFormApiRoute` which emits an API route stub for
 * pages that include a form-archetype section (e.g. TourForm POSTs to
 * /api/schedule-tour — the route must exist for the generated build to serve
 * the form without 404s).
 *
 * Templates are intentionally simple string concatenation. No template engine.
 */

import { mkdir, writeFile } from "node:fs/promises"
import { join } from "node:path"

/**
 * @typedef {import("./resolve.mjs").ResolvedSection} ResolvedSection
 */

/**
 * Assemble page.tsx, layout.tsx, and globals.css into the output dir.
 * @param {ResolvedSection[]} resolvedSections
 * @param {object} config  The validated page config
 * @param {string} outputDir  Absolute path to the (temp) output directory
 */
export async function assemblePage(resolvedSections, config, outputDir) {
  const pageTsx = renderPage(resolvedSections)
  const layoutTsx = renderLayout(config)
  const globalsCss = renderGlobals()

  await writeFile(join(outputDir, "src/app/page.tsx"), pageTsx, "utf8")
  await writeFile(join(outputDir, "src/app/layout.tsx"), layoutTsx, "utf8")
  await writeFile(join(outputDir, "src/app/globals.css"), globalsCss, "utf8")
}

/**
 * Render the page.tsx file content.
 * @param {ResolvedSection[]} resolvedSections
 * @returns {string}
 */
export function renderPage(resolvedSections) {
  const imports = []
  const elements = []
  const seenImports = new Set()

  for (const section of resolvedSections) {
    const name = section.entry.name
    const tier = section.entry.tier
    const importPath =
      tier === "atom" ? `@/system/atoms/${name}` : `@/system/recipes/${name}`

    if (!seenImports.has(name)) {
      imports.push(`import { ${name} } from "${importPath}"`)
      seenImports.add(name)
    }

    // Components that accept an `id` prop directly take the section id as
    // their own attribute; everything else is wrapped in a <div id="…"> so
    // anchor-style navigation still works regardless of the component's API.
    const acceptsId = section.entry.acceptsId === true
    const inlineSectionId = acceptsId ? section.sectionId : undefined
    const propsLiteral = renderProps(section.content, section.config, inlineSectionId)
    const componentJsx = `<${name}${propsLiteral} />`

    if (!acceptsId && section.sectionId) {
      elements.push(`      <div id=${JSON.stringify(section.sectionId)}>`)
      elements.push(`        ${componentJsx}`)
      elements.push(`      </div>`)
    } else {
      elements.push(`      ${componentJsx}`)
    }
  }

  return [
    ...imports,
    "",
    "export default function Page() {",
    "  return (",
    "    <main>",
    ...elements,
    "    </main>",
    "  )",
    "}",
    "",
  ].join("\n")
}

/**
 * JSX prop identifier pattern (must be a valid JS identifier).
 * Prop keys with dashes or other special chars cannot appear as JSX
 * attributes on a React component, so we throw if we encounter one.
 */
const JSX_IDENT = /^[A-Za-z_$][A-Za-z0-9_$]*$/

/**
 * Render the props section for a single component element.
 * Each prop becomes `name={JSON_VALUE}` so strings, numbers, arrays, and
 * objects are all valid JSX expression containers.
 * @param {object} content
 * @param {object} config
 * @param {string|undefined} sectionId
 * @returns {string}
 */
function renderProps(content, config, sectionId) {
  const merged = { ...config, ...content }
  // sectionId becomes a top-level `id` prop (not part of content)
  if (sectionId) merged.id = sectionId

  const keys = Object.keys(merged)
  if (keys.length === 0) return ""

  const parts = []
  for (const key of keys) {
    if (!JSX_IDENT.test(key)) {
      throw new Error(`Prop name "${key}" is not a valid JSX identifier`)
    }
    parts.push(`${key}={${JSON.stringify(merged[key])}}`)
  }
  return "\n        " + parts.join("\n        ") + "\n      "
}

/**
 * Render the layout.tsx file content.
 * @param {object} config
 * @returns {string}
 */
export function renderLayout(config) {
  // JSON.stringify handles newlines, backslashes, unicode, and embedded quotes
  // safely so arbitrary meta strings cannot break out of the literal.
  const titleLiteral = JSON.stringify(config.meta?.title ?? config.name)
  const descLiteral = JSON.stringify(config.meta?.description ?? "")
  const theme = config.theme ?? "dark"

  return `import type { Metadata } from "next"
import { Playfair_Display, Lato, Libre_Franklin, Parisienne } from "next/font/google"
import "./globals.css"

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
})
const lato = Lato({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-body",
})
const libreFranklin = Libre_Franklin({
  subsets: ["latin"],
  variable: "--font-ui",
})
const parisienne = Parisienne({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-script",
})

export const metadata: Metadata = {
  title: ${titleLiteral},
  description: ${descLiteral},
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      data-theme="${theme}"
      className={\`\${playfair.variable} \${lato.variable} \${libreFranklin.variable} \${parisienne.variable}\`}
    >
      <body>{children}</body>
    </html>
  )
}
`
}

/**
 * Render the globals.css file content.
 * @returns {string}
 */
export function renderGlobals() {
  return `@import "../styles/reset.css";
@import "../styles/tokens/index.css";
@import "../styles/layout-utilities.css";
`
}

/**
 * Render the content of the schedule-tour API route stub.
 *
 * Generates a Next.js Route Handler with a Zod schema that validates the
 * incoming POST body. Bounded string lengths prevent trivial DoS via
 * unbounded input. The handler is intentionally a stub — wiring to a real
 * email service, CRM, or database is a TODO for the consumer.
 *
 * @returns {string}
 */
export function renderScheduleTourRoute() {
  return `import { NextResponse } from "next/server"
import { z } from "zod"

const TourRequestSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  phone: z.string().max(40).optional(),
  date: z.string().max(40).optional(),
  details: z.string().max(2000).optional(),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = TourRequestSchema.parse(body)
    // TODO: Wire to email service, CRM, or database
    console.log("Tour request received:", data)
    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, errors: error.flatten() },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { ok: false, error: "Invalid request" },
      { status: 400 }
    )
  }
}
`
}

/**
 * Write an API route stub for form sections.
 *
 * Called after assemblePage when the resolved config includes any section
 * with archetype === "form". Currently only the schedule-tour endpoint is
 * emitted because that is the single endpoint the V1 forms POST to.
 *
 * @param {import("./resolve.mjs").ResolvedSection[]} resolvedSections
 * @param {string} outputDir  Absolute path to the (temp) output directory
 * @returns {Promise<string[]>} list of generated route file paths (relative to outputDir)
 */
export async function writeFormApiRoutes(resolvedSections, outputDir) {
  const hasForm = resolvedSections.some(
    (s) => s.entry.archetype === "form"
  )
  if (!hasForm) return []

  const routeRel = "src/app/api/schedule-tour/route.ts"
  const routeDir = join(outputDir, "src/app/api/schedule-tour")
  await mkdir(routeDir, { recursive: true })
  await writeFile(join(outputDir, routeRel), renderScheduleTourRoute(), "utf8")
  return [routeRel]
}
