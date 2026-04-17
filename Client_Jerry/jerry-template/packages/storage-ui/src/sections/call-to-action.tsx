import React from 'react'
import { z } from 'zod'
import { ImageSchema, CTASchema } from '@jerry/facility-config/schema'
import { Section, Container, Box } from '../primitives'
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

export function CallToAction({ content, variant = 'gradient', layout }: SectionProps) {
  const c = content as unknown as CallToActionContent

  // layout: "centered" (default) or "left-aligned"
  const textAlign = layout === 'left-aligned' ? 'left' : 'center'

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

  if (c.image) {
    return (
      <Section background={c.image} overlay="dark">
        <Container>
          <Box style={{ textAlign, color: 'white' }}>
            <SectionHeader heading={c.heading} description={c.blurb} level="2" align={textAlign === 'left' ? 'left' : 'center'} invertColor />
            <CTAGroup primary={c.cta} secondary={c.ctaSecondary} />
          </Box>
        </Container>
      </Section>
    )
  }

  return (
    <Section>
      <Box py="7" style={{ textAlign, ...variantStyles[variant ?? 'gradient'] }}>
        <Container>
          <SectionHeader heading={c.heading} description={c.blurb} level="2" align={textAlign === 'left' ? 'left' : 'center'} />
          <CTAGroup primary={c.cta} secondary={c.ctaSecondary} />
        </Container>
      </Box>
    </Section>
  )
}
