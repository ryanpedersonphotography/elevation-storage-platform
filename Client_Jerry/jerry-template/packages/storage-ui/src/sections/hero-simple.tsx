import React from 'react'
import { z } from 'zod'
import { Section, Container } from '../primitives'
import { SectionHeader } from '../compositions'
import type { SectionProps } from '../renderer/registry'

export const HeroSimpleContentSchema = z.object({
  heading: z.string().min(1),
  blurb: z.string().optional(),
  breadcrumb: z.boolean().optional(),
})

type HeroSimpleContent = z.infer<typeof HeroSimpleContentSchema>

export function HeroSimple({ content, variant = 'minimal' }: SectionProps) {
  const c = content as unknown as HeroSimpleContent

  const style: React.CSSProperties =
    variant === 'colored'
      ? { backgroundColor: 'var(--accent-3, #f0f0f0)' }
      : {}

  return (
    <Section className={variant === 'colored' ? 'hero-simple-colored' : undefined}>
      <div style={style}>
        <Container>
          <SectionHeader heading={c.heading} description={c.blurb} level="2" />
        </Container>
      </div>
    </Section>
  )
}
