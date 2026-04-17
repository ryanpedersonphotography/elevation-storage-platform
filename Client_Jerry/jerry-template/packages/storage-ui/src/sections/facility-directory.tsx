import React from 'react'
import { z } from 'zod'
import { Section, Container, Grid, Flex, Text, Box } from '../primitives'
import { SectionHeader, FacilityCard } from '../compositions'
import type { SectionProps } from '../renderer/registry'
import type { FacilityConfig } from '@jerry/facility-config/schema'

export const FacilityDirectoryContentSchema = z.object({
  heading: z.string().min(1),
  blurb: z.string().optional(),
})

type FacilityDirectoryContent = z.infer<typeof FacilityDirectoryContentSchema>

interface FacilityDirectoryProps extends SectionProps {
  facilities?: FacilityConfig[]
}

export function FacilityDirectory({ content, variant = 'cards', facilities = [] }: FacilityDirectoryProps) {
  const c = content as unknown as FacilityDirectoryContent

  if (variant === 'list') {
    return (
      <Section>
        <Container>
          <SectionHeader heading={c.heading} description={c.blurb} level="2" />
          <Flex direction="column" gap="3">
            {facilities.map((f) => (
              <Box
                key={f.slug}
                style={{
                  padding: '1rem',
                  border: '1px solid var(--gray-6, #ddd)',
                  borderRadius: '8px',
                }}
              >
                <Text as="p" size="3" weight="bold">{f.name}</Text>
                <Text as="p" size="2" color="gray">
                  {f.info.address.city}, {f.info.address.state}
                </Text>
                <Text as="p" size="2">{f.info.phone}</Text>
              </Box>
            ))}
          </Flex>
        </Container>
      </Section>
    )
  }

  if (variant === 'featured') {
    return (
      <Section>
        <Container>
          <SectionHeader heading={c.heading} description={c.blurb} level="2" />
          <Grid columns={{ initial: '1', md: '2' }} gap="5">
            {facilities.map((f) => (
              <FacilityCard key={f.slug} facility={f} href={`/${f.slug}`} />
            ))}
          </Grid>
        </Container>
      </Section>
    )
  }

  // cards (default) and map variant fall back to cards layout
  return (
    <Section>
      <Container>
        <SectionHeader heading={c.heading} description={c.blurb} level="2" />
        <Grid columns={{ initial: '1', sm: '2', md: '3' }} gap="4">
          {facilities.map((f) => (
            <FacilityCard key={f.slug} facility={f} href={`/${f.slug}`} />
          ))}
        </Grid>
      </Container>
    </Section>
  )
}
