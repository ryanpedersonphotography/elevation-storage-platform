import React from 'react'
import { z } from 'zod'
import { ImageSchema, CTASchema } from '@jerry/facility-config'
import { Section, Container, Heading, Text } from '../primitives'
import { CTAGroup } from '../compositions'
import type { SectionProps } from '../renderer/registry'

export const HeroContentSchema = z.object({
  heading: z.string().min(1),
  subtitle: z.string().optional(),
  image: ImageSchema,
  cta: CTASchema.optional(),
})

type HeroContent = z.infer<typeof HeroContentSchema>

export function Hero({ content, variant = 'overlay' }: SectionProps) {
  const c = content as unknown as HeroContent

  if (variant === 'split') {
    return (
      <Section>
        <Container>
          <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 0%', minWidth: '280px' }}>
              <img
                src={c.image.src}
                alt={c.image.alt}
                style={{ width: '100%', height: 'auto', objectFit: 'cover', borderRadius: '8px' }}
              />
            </div>
            <div style={{ flex: '1 1 0%', minWidth: '280px' }}>
              <Heading as="h1" size="8">{c.heading}</Heading>
              {c.subtitle && (
                <Text as="p" size="4" mt="3" color="gray">{c.subtitle}</Text>
              )}
              {c.cta && (
                <div style={{ marginTop: '1.5rem' }}>
                  <CTAGroup primary={c.cta} />
                </div>
              )}
            </div>
          </div>
        </Container>
      </Section>
    )
  }

  // overlay (default) and wave variants
  return (
    <Section background={c.image} overlay="dark">
      <Container>
        <div style={{ textAlign: 'center', color: 'white', padding: '4rem 0' }}>
          <Heading as="h1" size="8" style={{ color: 'white' }}>{c.heading}</Heading>
          {c.subtitle && (
            <Text as="p" size="4" mt="3" style={{ color: 'rgba(255,255,255,0.9)' }}>
              {c.subtitle}
            </Text>
          )}
          {c.cta && (
            <div style={{ marginTop: '1.5rem' }}>
              <CTAGroup primary={c.cta} />
            </div>
          )}
        </div>
      </Container>
      {variant === 'wave' && (
        <svg
          viewBox="0 0 1440 80"
          preserveAspectRatio="none"
          style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '80px' }}
          aria-hidden="true"
        >
          <path d="M0,40 C360,80 720,0 1440,40 L1440,80 L0,80 Z" fill="white" />
        </svg>
      )}
    </Section>
  )
}
