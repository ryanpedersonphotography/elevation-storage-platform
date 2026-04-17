import React from 'react'
import { z } from 'zod'
import { Section, Container, Grid, Badge, Table, Heading, Text, Box, Button } from '../primitives'
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

/** Map layout prop to Grid columns */
function resolveColumns(layout?: string): Record<string, string> {
  switch (layout) {
    case '2-col':
      return { initial: '1', sm: '2' }
    case '4-col':
      return { initial: '1', sm: '2', md: '4' }
    case '3-col':
    default:
      return { initial: '1', sm: '2', md: '3' }
  }
}

export function UnitGrid({ content, variant = 'cards', layout, facilityData }: SectionProps) {
  const c = content as unknown as UnitGridContent
  const allUnits = facilityData?.data?.units ?? []
  const filtered = c.filter?.length
    ? allUnits.filter((u) => c.filter!.includes(u.id))
    : allUnits
  // Fall back to all units when filter matches nothing
  const units = filtered.length > 0 ? filtered : allUnits

  const isFullWidth = layout === 'full-width'
  const columns = resolveColumns(layout)

  const gridContent = (
    <>
      <SectionHeader heading={c.heading} description={c.blurb} level="2" />
      {variant === 'table' ? (
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
      ) : (
        <Grid columns={columns} gap="4">
          {units.map((unit) => {
            const isAvailable = unit.available !== false

            return (
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
                  <Box mt="3" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Badge size="1" variant={isAvailable ? 'soft' : 'surface'} color={isAvailable ? 'green' : 'gray'}>
                      {isAvailable ? 'Available' : 'Unavailable'}
                    </Badge>
                    {isAvailable && (
                      <Button size="2" variant="solid" asChild>
                        <a href="?reserve">Reserve</a>
                      </Button>
                    )}
                  </Box>
                </Box>
              </ContentCard>
            )
          })}
        </Grid>
      )}
    </>
  )

  return (
    <Section>
      {isFullWidth ? gridContent : <Container>{gridContent}</Container>}
    </Section>
  )
}
