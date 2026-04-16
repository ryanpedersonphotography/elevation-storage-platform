import type { z } from 'zod'
import type {
  FacilityConfigSchema,
  PageSchema,
  SectionSchema,
  UnitSchema,
  AmenitySchema,
  TestimonialSchema,
  HoursSchema,
  ImageSchema,
  CTASchema,
  BrandingSchema,
  DeploymentSchema,
  FacilitySeoSchema,
  PageSeoSchema,
  InfoSchema,
  AddressSchema,
  CoordinatesSchema,
  DataSchema,
} from './schema'

export type FacilityConfig = z.infer<typeof FacilityConfigSchema>
export type Page = z.infer<typeof PageSchema>
export type Section = z.infer<typeof SectionSchema>
export type Unit = z.infer<typeof UnitSchema>
export type Amenity = z.infer<typeof AmenitySchema>
export type Testimonial = z.infer<typeof TestimonialSchema>
export type Hours = z.infer<typeof HoursSchema>
export type Image = z.infer<typeof ImageSchema>
export type CTA = z.infer<typeof CTASchema>
export type Branding = z.infer<typeof BrandingSchema>
export type Deployment = z.infer<typeof DeploymentSchema>
export type FacilitySeo = z.infer<typeof FacilitySeoSchema>
export type PageSeo = z.infer<typeof PageSeoSchema>
export type Info = z.infer<typeof InfoSchema>
export type Address = z.infer<typeof AddressSchema>
export type Coordinates = z.infer<typeof CoordinatesSchema>
export type FacilityData = z.infer<typeof DataSchema>
