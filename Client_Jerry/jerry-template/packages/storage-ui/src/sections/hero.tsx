import React from 'react'
import { z } from 'zod'
import { ImageSchema, CTASchema } from '@jerry/facility-config/schema'
import { Section, Container, Heading, Text, Flex, Box, Image } from '../primitives'
import { CTAGroup } from '../compositions'
import type { SectionProps } from '../renderer/registry'

export const HeroContentSchema = z.object({
  heading: z.string().min(1),
  subtitle: z.string().optional(),
  image: ImageSchema,
  cta: CTASchema.optional(),
})

type HeroContent = z.infer<typeof HeroContentSchema>

export function Hero({ content, variant = 'overlay', layout }: SectionProps) {
  const c = content as unknown as HeroContent

  if (variant === 'split') {
    const imageFirst = layout === 'image-left'

    const imageBlock = (
      <Box flexGrow="1" flexShrink="1" flexBasis="0%" style={{ minWidth: '280px' }}>
        <Image src={c.image.src} alt={c.image.alt} aspect="16/9" />
      </Box>
    )

    const textBlock = (
      <Box flexGrow="1" flexShrink="1" flexBasis="0%" style={{ minWidth: '280px' }}>
        <Heading as="h1" size="8">{c.heading}</Heading>
        {c.subtitle && (
          <Text as="p" size="4" mt="3" color="gray">{c.subtitle}</Text>
        )}
        {c.cta && (
          <Box mt="5">
            <CTAGroup primary={c.cta} />
          </Box>
        )}
      </Box>
    )

    return (
      <Section>
        <Container>
          <Flex gap="5" align="center" wrap="wrap">
            {imageFirst ? (
              <>
                {imageBlock}
                {textBlock}
              </>
            ) : (
              <>
                {textBlock}
                {imageBlock}
              </>
            )}
          </Flex>
        </Container>
      </Section>
    )
  }

  // overlay (default) and wave variants
  // layout: "centered" (default) centers text, "left-aligned" aligns left
  const textAlign = layout === 'left-aligned' ? 'left' : 'center'

  return (
    <Section background={c.image} overlay="dark">
      <Container>
        <Box py="9" style={{ textAlign, color: 'white' }}>
          <Heading as="h1" size="8" weight="bold" style={{ color: 'white' }}>{c.heading}</Heading>
          {c.subtitle && (
            <Text as="p" size="4" mt="3" style={{ color: 'rgba(255,255,255,0.95)' }}>
              {c.subtitle}
            </Text>
          )}
          {c.cta && (
            <Box mt="5">
              <CTAGroup primary={c.cta} />
            </Box>
          )}
        </Box>
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
