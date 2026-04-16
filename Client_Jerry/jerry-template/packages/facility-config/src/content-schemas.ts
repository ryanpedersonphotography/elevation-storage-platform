/**
 * Per-component content schemas for build-time validation.
 * These duplicate the schemas defined in storage-ui sections to avoid
 * circular dependency (facility-config must not depend on storage-ui).
 *
 * Note: ImageSchema and CTASchema are duplicated here (not imported from
 * schema.ts) to avoid circular imports, since schema.ts imports this file.
 */
import { z } from 'zod'

const ImageSchema = z.object({
  src: z.string().min(1),
  alt: z.string(),
})

const CTASchema = z.object({
  label: z.string().min(1),
  href: z.string().min(1),
  variant: z.enum(['primary', 'secondary', 'outline', 'ghost']),
})

export const HeroContentSchema = z.object({
  heading: z.string().min(1),
  subtitle: z.string().optional(),
  image: ImageSchema,
  cta: CTASchema.optional(),
})

export const HeroSimpleContentSchema = z.object({
  heading: z.string().min(1),
  blurb: z.string().optional(),
  breadcrumb: z.boolean().optional(),
})

export const ContentSectionContentSchema = z.object({
  heading: z.string().min(1),
  blurb: z.string().optional(),
  paragraphs: z.array(z.string()).optional(),
  image: ImageSchema.optional(),
})

export const UnitGridContentSchema = z.object({
  heading: z.string().min(1),
  blurb: z.string().optional(),
  showPricing: z.boolean().optional(),
  showFeatures: z.boolean().optional(),
  filter: z.array(z.string()).optional(),
})

export const FeatureGridContentSchema = z.object({
  heading: z.string().min(1),
  blurb: z.string().optional(),
  features: z
    .array(
      z.object({
        icon: z.string(),
        heading: z.string(),
        blurb: z.string(),
      })
    )
    .optional(),
})

export const CallToActionContentSchema = z.object({
  heading: z.string().min(1),
  blurb: z.string().optional(),
  image: ImageSchema.optional(),
  cta: CTASchema,
  ctaSecondary: CTASchema.optional(),
})

export const ContactFormContentSchema = z.object({
  heading: z.string().min(1),
  blurb: z.string().optional(),
  fields: z.array(
    z.enum(['name', 'email', 'phone', 'unitSize', 'moveInDate', 'message'])
  ),
  submitLabel: z.string().min(1),
  successMessage: z.string().min(1),
})

export const MapSectionContentSchema = z.object({
  heading: z.string().min(1),
  blurb: z.string().optional(),
  directions: z
    .array(
      z.object({
        from: z.string(),
        steps: z.string(),
      })
    )
    .optional(),
})

export const TestimonialGridContentSchema = z.object({
  heading: z.string().min(1),
  blurb: z.string().optional(),
  limit: z.number().positive().optional(),
})

export const SizeGuideContentSchema = z.object({
  heading: z.string().min(1),
  blurb: z.string().optional(),
  guides: z.array(
    z.object({
      size: z.string(),
      description: z.string(),
      fits: z.array(z.string()),
    })
  ),
})

export const FacilityDirectoryContentSchema = z.object({
  heading: z.string().min(1),
  blurb: z.string().optional(),
})

export const FAQContentSchema = z.object({
  heading: z.string().min(1),
  blurb: z.string().optional(),
  items: z.array(z.object({
    question: z.string().min(1),
    answer: z.string().min(1),
  })).optional(),
})

/**
 * Registry mapping component names to their content Zod schema.
 * Used during validation to ensure content matches the expected shape.
 */
export const contentSchemaRegistry: Record<string, z.ZodTypeAny> = {
  Hero: HeroContentSchema,
  HeroSimple: HeroSimpleContentSchema,
  ContentSection: ContentSectionContentSchema,
  UnitGrid: UnitGridContentSchema,
  FeatureGrid: FeatureGridContentSchema,
  CallToAction: CallToActionContentSchema,
  ContactForm: ContactFormContentSchema,
  MapSection: MapSectionContentSchema,
  TestimonialGrid: TestimonialGridContentSchema,
  SizeGuide: SizeGuideContentSchema,
  FacilityDirectory: FacilityDirectoryContentSchema,
  FAQ: FAQContentSchema,
}
