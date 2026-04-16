import React from 'react'
import { z } from 'zod'
import { Section, Container, Grid, Badge } from '../primitives'
import { SectionHeader, FeatureItem, ContentCard } from '../compositions'
import type { SectionProps } from '../renderer/registry'

export const FeatureGridContentSchema = z.object({
  heading: z.string().min(1),
  blurb: z.string().optional(),
  features: z.array(z.object({
    icon: z.string(),
    heading: z.string(),
    blurb: z.string(),
  })).optional(),
})

type FeatureGridContent = z.infer<typeof FeatureGridContentSchema>

interface Feature {
  icon: string
  heading: string
  blurb: string
}

export function FeatureGrid({ content, variant = 'icons', facilityData }: SectionProps) {
  const c = content as unknown as FeatureGridContent

  // Use inline features or fall back to facilityData amenities
  const features: Feature[] = c.features ?? (
    facilityData?.data?.amenities?.map((a) => ({
      icon: a.icon,
      heading: a.label,
      blurb: a.description,
    })) ?? []
  )

  if (variant === 'pills') {
    return (
      <Section>
        <Container>
          <SectionHeader heading={c.heading} description={c.blurb} level="2" />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center' }}>
            {features.map((f) => (
              <Badge key={f.heading} size="2">{f.heading}</Badge>
            ))}
          </div>
        </Container>
      </Section>
    )
  }

  if (variant === 'cards') {
    return (
      <Section>
        <Container>
          <SectionHeader heading={c.heading} description={c.blurb} level="2" />
          <Grid columns={{ initial: '1', sm: '2', md: '3' }} gap="4">
            {features.map((f) => (
              <ContentCard key={f.heading} title={f.heading} description={f.blurb} />
            ))}
          </Grid>
        </Container>
      </Section>
    )
  }

  // icons (default)
  return (
    <Section>
      <Container>
        <SectionHeader heading={c.heading} description={c.blurb} level="2" />
        <Grid columns={{ initial: '1', sm: '2', md: '3' }} gap="5">
          {features.map((f) => (
            <FeatureItem
              key={f.heading}
              icon={f.icon}
              heading={f.heading}
              description={f.blurb}
            />
          ))}
        </Grid>
      </Container>
    </Section>
  )
}
