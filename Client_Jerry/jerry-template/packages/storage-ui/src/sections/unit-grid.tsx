import React from 'react'
import { z } from 'zod'
import { Section, Container, Grid, Badge, Table, Heading, Text, Box } from '../primitives'
import { SectionHeader, ContentCard } from '../compositions'
import type { SectionProps } from '../renderer/registry'

export const UnitGridContentSchema = z.object({
  heading: z.string().min(1),
  blurb: z.string().optional(),
  showPricing: z.boolean().optional(),
  showFeatures: z.boolean().optional(),
  filter: z.array(z.string()).optional(),
})

type UnitGridContent = z.infer<typeof UnitGridContentSchema>

export function UnitGrid({ content, variant = 'cards', facilityData }: SectionProps) {
  const c = content as unknown as UnitGridContent
  const allUnits = facilityData?.data?.units ?? []
  const units = c.filter?.length
    ? allUnits.filter((u) => c.filter!.includes(u.id))
    : allUnits

  if (variant === 'table') {
    return (
      <Section>
        <Container>
          <SectionHeader heading={c.heading} description={c.blurb} level="2" />
          <Table.Root>
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeaderCell>Size</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Sq Ft</Table.ColumnHeaderCell>
                {c.showPricing !== false && (
                  <Table.ColumnHeaderCell>Price</Table.ColumnHeaderCell>
                )}
                {c.showFeatures && (
                  <Table.ColumnHeaderCell>Features</Table.ColumnHeaderCell>
                )}
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {units.map((unit) => (
                <Table.Row key={unit.id}>
                  <Table.Cell>{unit.size}</Table.Cell>
                  <Table.Cell>{unit.sqft}</Table.Cell>
                  {c.showPricing !== false && (
                    <Table.Cell>${unit.price}/mo</Table.Cell>
                  )}
                  {c.showFeatures && (
                    <Table.Cell>
                      {unit.features.map((f) => (
                        <Badge key={f} mr="1" size="1">{f}</Badge>
                      ))}
                    </Table.Cell>
                  )}
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        </Container>
      </Section>
    )
  }

  // cards (default) and compact
  return (
    <Section>
      <Container>
        <SectionHeader heading={c.heading} description={c.blurb} level="2" />
        <Grid columns={{ initial: '1', sm: '2', md: '3' }} gap="4">
          {units.map((unit) => (
            <ContentCard key={unit.id} title={unit.size}>
              <Box>
                <Text as="p" size="2">
                  {unit.sqft} sq ft
                </Text>
                {c.showPricing !== false && (
                  <Heading as="h4" size="5" mt="2">
                    ${unit.price}
                    <Text as="span" size="2" color="gray">/mo</Text>
                  </Heading>
                )}
                {c.showFeatures && unit.features.length > 0 && (
                  <Box mt="2">
                    {unit.features.map((f) => (
                      <Badge key={f} mr="1" size="1">{f}</Badge>
                    ))}
                  </Box>
                )}
              </Box>
            </ContentCard>
          ))}
        </Grid>
      </Container>
    </Section>
  )
}
