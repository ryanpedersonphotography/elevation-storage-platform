import type { ComponentType } from 'react'
import type { FacilityConfig } from '@jerry/facility-config'

export interface SectionProps {
  content: Record<string, unknown>
  layout?: string
  variant?: string
  facilityData: FacilityConfig
}

// Stub registry — real section components will be added in Phase 6
// For now, each renders a placeholder div with the component name
const StubSection = ({ content }: SectionProps) => {
  const heading = (content as Record<string, unknown>)?.heading ?? 'Section'
  return <div data-section={String(heading)}>{String(heading)}</div>
}

export const registry: Record<string, ComponentType<SectionProps>> = {
  Hero: StubSection,
  HeroSimple: StubSection,
  ContentSection: StubSection,
  UnitGrid: StubSection,
  FeatureGrid: StubSection,
  CallToAction: StubSection,
  ContactForm: StubSection,
  MapSection: StubSection,
  TestimonialGrid: StubSection,
  SizeGuide: StubSection,
  FacilityDirectory: StubSection,
}
