import type { ComponentType } from 'react'
import type { FacilityConfig } from '@jerry/facility-config'
import { Hero } from '../sections/hero'
import { HeroSimple } from '../sections/hero-simple'
import { ContentSection } from '../sections/content-section'
import { UnitGrid } from '../sections/unit-grid'
import { FeatureGrid } from '../sections/feature-grid'
import { CallToAction } from '../sections/call-to-action'
import { ContactForm } from '../sections/contact-form'
import { MapSection } from '../sections/map-section'
import { TestimonialGrid } from '../sections/testimonial-grid'
import { SizeGuide } from '../sections/size-guide'
import { FacilityDirectory } from '../sections/facility-directory'
import { FAQ } from '../sections/faq'

export interface SectionProps {
  content: Record<string, unknown>
  layout?: string
  variant?: string
  facilityData: FacilityConfig
}

export const registry: Record<string, ComponentType<SectionProps>> = {
  Hero,
  HeroSimple,
  ContentSection,
  UnitGrid,
  FeatureGrid,
  CallToAction,
  ContactForm,
  MapSection,
  TestimonialGrid,
  SizeGuide,
  FacilityDirectory: FacilityDirectory as ComponentType<SectionProps>,
  FAQ,
}
