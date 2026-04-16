import React from 'react'
import { z } from 'zod'
import { Section, Container, Grid, Table, Text, Box } from '../primitives'
import { SectionHeader, ContentCard } from '../compositions'
import type { SectionProps } from '../renderer/registry'

export const SizeGuideContentSchema = z.object({
  heading: z.string().min(1),
  blurb: z.string().optional(),
  guides: z.array(z.object({
    size: z.string(),
    description: z.string(),
    fits: z.array(z.string()),
  })),
})

type SizeGuideContent = z.infer<typeof SizeGuideContentSchema>

export function SizeGuide({ content, variant = 'visual' }: SectionProps) {
  const c = content as unknown as SizeGuideContent

  if (variant === 'table') {
    return (
      <Section>
        <Container>
          <SectionHeader heading={c.heading} description={c.blurb} level="2" />
          <Table.Root>
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeaderCell>Size</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Description</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>What Fits</Table.ColumnHeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {c.guides.map((guide) => (
                <Table.Row key={guide.size}>
                  <Table.Cell>{guide.size}</Table.Cell>
                  <Table.Cell>{guide.description}</Table.Cell>
                  <Table.Cell>{guide.fits.join(', ')}</Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        </Container>
      </Section>
    )
  }

  // visual (default) — cards with details
  return (
    <Section>
      <Container>
        <SectionHeader heading={c.heading} description={c.blurb} level="2" />
        <Grid columns={{ initial: '1', sm: '2', md: '3' }} gap="4">
          {c.guides.map((guide) => (
            <ContentCard key={guide.size} title={guide.size} description={guide.description}>
              <Box mt="2">
                <Text as="p" size="2" weight="bold">What fits:</Text>
                <ul style={{ margin: '0.25rem 0 0 1rem', padding: 0 }}>
                  {guide.fits.map((item) => (
                    <li key={item}>
                      <Text as="span" size="2">{item}</Text>
                    </li>
                  ))}
                </ul>
              </Box>
            </ContentCard>
          ))}
        </Grid>
      </Container>
    </Section>
  )
}
