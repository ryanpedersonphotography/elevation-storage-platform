import { z } from "zod"

/** Candidates supported by the builder */
const VALID_CANDIDATES = [
  "sidebar-glass-gsap",
  "sidebar-glass",
  "classic-clean",
  "landing-version",
]

/**
 * Remove all HTML tags (and their content for script/style) from a string.
 * First strips script and style blocks including their inner content,
 * then removes any remaining tags.
 * @param {string} str
 * @returns {string}
 */
function stripHtml(str) {
  return str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<[^>]*>/g, "")
}

/**
 * Recursively sanitize all string values in an object by stripping HTML tags.
 * @param {unknown} obj
 * @returns {unknown}
 */
function sanitizeContent(obj) {
  if (typeof obj === "string") {
    return stripHtml(obj)
  }
  if (Array.isArray(obj)) {
    return obj.map(sanitizeContent)
  }
  if (obj !== null && typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [k, sanitizeContent(v)])
    )
  }
  return obj
}

/** Schema for a single page section */
const SectionSchema = z.object({
  /** Registry identifier in the format "candidate:component-name" */
  registryId: z.string().regex(/^[\w-]+:[\w-]+$/, {
    message: "registryId must match pattern 'candidate:component-name'",
  }),
  /** Arbitrary content props passed to the component */
  content: z.record(z.unknown()).default({}),
  /** Arbitrary config overrides for the section */
  config: z.record(z.unknown()).default({}),
  /** Optional stable HTML id for the section element */
  id: z.string().optional(),
})

/**
 * Schema for optional page meta tags.
 *
 * `title` and `description` are sanitized via stripHtml so embedded
 * `<script>`, `<style>`, or other markup cannot leak into the rendered
 * `<head>`. The transform is chained before `.optional()` so it only runs
 * on a present string and `undefined` passes through cleanly.
 */
const MetaSchema = z.object({
  title: z.string().transform(stripHtml).optional(),
  description: z.string().transform(stripHtml).optional(),
  ogImage: z.string().optional(),
})

/** Full page config schema with sanitization transform */
const PageConfigSchema = z
  .object({
    /** URL-safe page name (kebab-case) */
    name: z
      .string()
      .min(1, { message: "name is required" })
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
        message: "name must be kebab-case (e.g. my-page)",
      }),
    /** Which candidate template this page is based on */
    baseCandidate: z.enum(VALID_CANDIDATES, {
      errorMap: () => ({
        message: `baseCandidate must be one of: ${VALID_CANDIDATES.join(", ")}`,
      }),
    }),
    /** Optional SEO / social meta */
    meta: MetaSchema.optional(),
    /** Color theme; defaults to dark */
    theme: z.enum(["dark", "light"]).default("dark"),
    /** Page sections — at least one required */
    sections: z.array(SectionSchema).min(1, {
      message: "sections must contain at least one entry",
    }),
  })
  .transform((data) => ({
    ...data,
    sections: data.sections.map((section) => ({
      ...section,
      content: sanitizeContent(section.content),
    })),
  }))

/**
 * Validate a raw page config object against the PageConfigSchema.
 *
 * @param {unknown} raw - The raw config object to validate
 * @returns {import("zod").SafeParseReturnType<unknown, unknown>}
 */
function validateConfig(raw) {
  return PageConfigSchema.safeParse(raw)
}

export { PageConfigSchema, validateConfig, VALID_CANDIDATES, stripHtml, sanitizeContent }
