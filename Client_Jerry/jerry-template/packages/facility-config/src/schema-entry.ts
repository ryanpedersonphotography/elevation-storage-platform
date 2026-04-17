// Client-safe entry point — no node:fs imports
// Use this via `@jerry/facility-config/schema` in code that may run in the browser

// ─── Content schema exports ───
export { contentSchemaRegistry } from './content-schemas'

// ─── Schema exports ───
export {
  OklchSchema,
  ImageSchema,
  CTASchema,
  HoursSchema,
  UnitSchema,
  AmenitySchema,
  TestimonialSchema,
  ComponentName,
  variantsByComponent,
  layoutValues,
  SectionSchema,
  PageSeoSchema,
  PageSchema,
  AddressSchema,
  CoordinatesSchema,
  InfoSchema,
  BrandingSchema,
  DeploymentSchema,
  FacilitySeoSchema,
  AnalyticsSchema,
  DataSchema,
  FacilityConfigSchema,
  FAQItemSchema,
} from './schema'

// ─── Type exports ───
export type {
  FacilityConfig,
  Page,
  Section,
  Unit,
  Amenity,
  Testimonial,
  Hours,
  Image,
  CTA,
  Branding,
  Deployment,
  FacilitySeo,
  PageSeo,
  Info,
  Address,
  Coordinates,
  FacilityData,
} from './types'
