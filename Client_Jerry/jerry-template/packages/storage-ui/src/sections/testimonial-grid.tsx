import React from 'react'
import { z } from 'zod'
import { Section, Container, Grid, Text, Box } from '../primitives'
import { SectionHeader, ContentCard } from '../compositions'
import type { SectionProps } from '../renderer/registry'

export const TestimonialGridContentSchema = z.object({
  heading: z.string().min(1),
  blurb: z.string().optional(),
  limit: z.number().positive().optional(),
})

type TestimonialGridContent = z.infer<typeof TestimonialGridContentSchema>

export function TestimonialGrid({ content, variant = 'cards', facilityData }: SectionProps) {
  const c = content as unknown as TestimonialGridContent
  const allTestimonials = facilityData?.data?.testimonials ?? []
  const testimonials = c.limit ? allTestimonials.slice(0, c.limit) : allTestimonials

  if (variant === 'quotes') {
    return (
      <Section>
        <Container>
          <SectionHeader heading={c.heading} description={c.blurb} level="2" />
          <Grid columns={{ initial: '1', md: '2' }} gap="5">
            {testimonials.map((t, i) => (
              <Box key={i} style={{ padding: '1.5rem', borderLeft: '4px solid var(--accent-9, #4f46e5)' }}>
                <blockquote style={{ margin: 0 }}>
                  <Text as="p" size="3" style={{ fontStyle: 'italic' }}>
                    &ldquo;{t.text}&rdquo;
                  </Text>
                  <Text as="p" size="2" mt="2" weight="bold">
                    {t.name}
                  </Text>
                  <Text as="p" size="1" color="gray">
                    {'★'.repeat(t.rating)}{'☆'.repeat(5 - t.rating)}
                  </Text>
                </blockquote>
              </Box>
            ))}
          </Grid>
        </Container>
      </Section>
    )
  }

  // cards (default)
  return (
    <Section>
      <Container>
        <SectionHeader heading={c.heading} description={c.blurb} level="2" />
        <Grid columns={{ initial: '1', sm: '2', md: '3' }} gap="4">
          {testimonials.map((t, i) => (
            <ContentCard key={i} title={t.name} description={t.text}>
              <Text as="p" size="1" color="gray">
                {'★'.repeat(t.rating)}{'☆'.repeat(5 - t.rating)}
              </Text>
            </ContentCard>
          ))}
        </Grid>
      </Container>
    </Section>
  )
}
