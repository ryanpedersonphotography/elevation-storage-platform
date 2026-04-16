import { z } from 'zod'
import { contentSchemaRegistry } from './content-schemas'

// ─── Strict OKLCH color validation — prevents CSS injection ───
export const OklchSchema = z.string().regex(
  /^oklch\(\s*[\d.]+\s+[\d.]+\s+[\d.]+\s*\)$/,
  'Must be a valid oklch() value, e.g. oklch(0.55 0.15 250)'
)

// ─── Reusable sub-schemas ───

export const ImageSchema = z.object({
  src: z.string().min(1),
  alt: z.string(), // can be empty for decorative images
})

export const CTASchema = z.object({
  label: z.string().min(1),
  href: z.string().min(1),
  variant: z.enum(['primary', 'secondary', 'outline', 'ghost']),
})

export const HoursSchema = z.object({
  days: z.array(z.enum(['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'])).min(1),
  open: z.string().regex(/^\d{2}:\d{2}$/, 'Must be HH:MM format (24-hour)'),
  close: z.string().regex(/^\d{2}:\d{2}$/, 'Must be HH:MM format (24-hour)'),
})

export const UnitSchema = z.object({
  id: z.string().min(1),
  size: z.string().min(1),
  sqft: z.number().positive(),
  price: z.number().nonnegative(),
  features: z.array(z.string()),
  available: z.boolean().optional(),
})

export const AmenitySchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  icon: z.string().min(1),
  description: z.string().min(1),
})

export const TestimonialSchema = z.object({
  name: z.string().min(1),
  rating: z.number().min(1).max(5),
  text: z.string().min(1),
})

// ─── Component names (hardcoded enum, not derived from registry at this stage) ───

export const ComponentName = z.enum([
  'Hero',
  'HeroSimple',
  'ContentSection',
  'UnitGrid',
  'FeatureGrid',
  'CallToAction',
  'ContactForm',
  'MapSection',
  'TestimonialGrid',
  'SizeGuide',
  'FacilityDirectory',
  'FAQ',
])

// ─── Valid variants per component ───

export const variantsByComponent: Record<string, string[]> = {
  Hero: ['overlay', 'split', 'wave', 'search'],
  HeroSimple: ['minimal', 'colored'],
  ContentSection: ['clean', 'bordered', 'soft'],
  UnitGrid: ['cards', 'table', 'compact'],
  FeatureGrid: ['icons', 'cards', 'pills'],
  CallToAction: ['gradient', 'solid', 'rounded'],
  ContactForm: ['standard', 'minimal'],
  MapSection: ['embedded', 'static'],
  TestimonialGrid: ['cards', 'quotes', 'featured'],
  SizeGuide: ['visual', 'table'],
  FacilityDirectory: ['cards', 'list', 'map', 'featured'],
  FAQ: ['accordion', 'list'],
}

// ─── Layout values ───

export const layoutValues = [
  'centered',
  'left-aligned',
  'image-right',
  'image-left',
  'stacked',
  'full-width',
  '2-col',
  '3-col',
  '4-col',
] as const

// ─── Section schema with variant cross-validation ───

export const SectionSchema = z
  .object({
    component: ComponentName,
    variant: z.string().optional(),
    layout: z.enum(layoutValues).optional(),
    content: z.record(z.unknown()), // per-component content validated separately
  })
  .superRefine((section, ctx) => {
    const allowed = variantsByComponent[section.component]
    if (section.variant && allowed && !allowed.includes(section.variant)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Invalid variant "${section.variant}" for ${section.component}. Allowed: ${allowed.join(', ')}`,
      })
    }

    // Validate content against the component's content schema
    const contentSchema = contentSchemaRegistry[section.component]
    if (contentSchema) {
      const contentResult = contentSchema.safeParse(section.content)
      if (!contentResult.success) {
        for (const issue of contentResult.error.issues) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['content', ...issue.path],
            message: `${section.component} content: ${issue.message}`,
          })
        }
      }
    }
  })

// ─── Page SEO schema ───

export const PageSeoSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  ogImage: z.string().optional(),
})

// ─── Page schema with cross-validation ───

export const PageSchema = z
  .object({
    enabled: z.boolean(),
    seo: PageSeoSchema.optional(),
    layout: z.array(z.string()),
    sections: z.record(SectionSchema),
  })
  .superRefine((page, ctx) => {
    // Skip cross-validation for disabled pages
    if (!page.enabled) return

    // Disallow duplicate layout keys
    const seen = new Set<string>()
    for (const key of page.layout) {
      if (seen.has(key)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Duplicate section key "${key}" in layout array`,
        })
      }
      seen.add(key)
    }

    // Cross-validate: every key in layout must exist in sections
    for (const key of page.layout) {
      if (!(key in page.sections)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Layout references section "${key}" but it is not defined in sections`,
        })
      }
    }

    // Warn: sections defined but not in layout (dead section)
    for (const key of Object.keys(page.sections)) {
      if (!page.layout.includes(key)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Section "${key}" is defined but not referenced in layout (dead section)`,
        })
      }
    }
  })

// ─── Top-level facility config schema ───

export const AddressSchema = z.object({
  street: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  zip: z.string().min(1),
})

export const CoordinatesSchema = z.object({
  lat: z.number(),
  lng: z.number(),
})

export const InfoSchema = z.object({
  address: AddressSchema,
  phone: z.string().min(1),
  email: z.string().email(),
  coordinates: CoordinatesSchema,
  hours: z.array(HoursSchema).min(1),
  directionsUrl: z.string().url().optional(),
  image: ImageSchema.optional(),
})

export const BrandingSchema = z.object({
  showParent: z.boolean(),
  template: z.enum(['modern', 'bold', 'friendly']),
  colors: z.object({
    primary: OklchSchema,
    accent: OklchSchema,
  }),
  logo: z.string().min(1),
})

export const DeploymentSchema = z.object({
  mode: z.enum(['subdirectory', 'standalone']),
  domain: z.string().nullable(),
})

export const FacilitySeoSchema = z.object({
  siteName: z.string().min(1),
  defaultTitle: z.string().min(1),
  defaultDescription: z.string().min(1),
  keywords: z.array(z.string()).optional(),
  ogImage: z.string().optional(),
})

export const AnalyticsSchema = z
  .object({
    gtag: z.string().nullable().optional(),
    gtagEvents: z.record(z.boolean()).optional(),
  })
  .optional()

export const FAQItemSchema = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
})

export const DataSchema = z.object({
  units: z.array(UnitSchema),
  amenities: z.array(AmenitySchema),
  testimonials: z.array(TestimonialSchema),
  faq: z.array(FAQItemSchema).optional(),
})

export const FacilityConfigSchema = z
  .object({
    slug: z.string().min(1),
    name: z.string().min(1),
    info: InfoSchema,
    branding: BrandingSchema,
    deployment: DeploymentSchema,
    seo: FacilitySeoSchema,
    analytics: AnalyticsSchema,
    pages: z.record(PageSchema),
    data: DataSchema,
    integrations: z.record(z.never()).optional(),
  })
  .superRefine((facility, ctx) => {
    // SEO-02: domain is required for standalone deployments
    if (facility.deployment.mode === 'standalone' && !facility.deployment.domain) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['deployment', 'domain'],
        message: 'domain is required when deployment.mode is "standalone"',
      })
    }

    // SCHEMA-03: FacilityDirectory is not allowed for standalone deployments
    if (facility.deployment.mode === 'standalone') {
      for (const [pageKey, page] of Object.entries(facility.pages)) {
        if (!page.enabled) continue
        for (const [sectionKey, section] of Object.entries(page.sections)) {
          if (section.component === 'FacilityDirectory') {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ['pages', pageKey, 'sections', sectionKey, 'component'],
              message: 'FacilityDirectory is not allowed in standalone deployments',
            })
          }
        }
      }
    }
  })
