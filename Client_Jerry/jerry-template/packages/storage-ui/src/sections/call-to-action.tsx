import React from 'react'
import { z } from 'zod'
import { ImageSchema, CTASchema } from '@jerry/facility-config'
import { Section, Container } from '../primitives'
import { SectionHeader, CTAGroup } from '../compositions'
import type { SectionProps } from '../renderer/registry'

export const CallToActionContentSchema = z.object({
  heading: z.string().min(1),
  blurb: z.string().optional(),
  image: ImageSchema.optional(),
  cta: CTASchema,
  ctaSecondary: CTASchema.optional(),
})

type CallToActionContent = z.infer<typeof CallToActionContentSchema>

export function CallToAction({ content, variant = 'gradient' }: SectionProps) {
  const c = content as unknown as CallToActionContent

  const variantStyles: Record<string, React.CSSProperties> = {
    gradient: {
      background: 'linear-gradient(135deg, var(--accent-9, #4f46e5), var(--accent-11, #3730a3))',
      color: 'white',
    },
    solid: {
      backgroundColor: 'var(--accent-9, #4f46e5)',
      color: 'white',
    },
    rounded: {
      backgroundColor: 'var(--accent-3, #eef2ff)',
      borderRadius: '16px',
      margin: '0 1rem',
    },
  }

  const wrapperStyle: React.CSSProperties = {
    textAlign: 'center',
    padding: '3rem 0',
    ...variantStyles[variant ?? 'gradient'],
  }

  if (c.image) {
    return (
      <Section background={c.image} overlay="dark">
        <Container>
          <div style={{ textAlign: 'center' }}>
            <SectionHeader heading={c.heading} description={c.blurb} level="2" />
            <CTAGroup primary={c.cta} secondary={c.ctaSecondary} />
          </div>
        </Container>
      </Section>
    )
  }

  return (
    <Section>
      <div style={wrapperStyle}>
        <Container>
          <SectionHeader heading={c.heading} description={c.blurb} level="2" />
          <CTAGroup primary={c.cta} secondary={c.ctaSecondary} />
        </Container>
      </div>
    </Section>
  )
}
