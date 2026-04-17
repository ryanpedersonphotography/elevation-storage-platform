import React from 'react'
import { z } from 'zod'
import { Check } from 'lucide-react'
import { Section, Container, Flex, Badge, Table, Heading, Text, Box, Button, Card } from '../primitives'
import { SectionHeader } from '../compositions'
import type { SectionProps } from '../renderer/registry'

export const UnitGridContentSchema = z.object({
  heading: z.string().min(1),
  blurb: z.string().optional(),
  showPricing: z.boolean().optional(),
  showFeatures: z.boolean().optional(),
  filter: z.array(z.string()).optional(),
})

type UnitGridContent = z.infer<typeof UnitGridContentSchema>

export function UnitGrid({ content, variant = 'cards', layout, facilityData }: SectionProps) {
  const c = content as unknown as UnitGridContent
  const allUnits = facilityData?.data?.units ?? []
  const filtered = c.filter?.length
    ? allUnits.filter((u) => c.filter!.includes(u.id))
    : allUnits
  // Fall back to all units when filter matches nothing
  const units = filtered.length > 0 ? filtered : allUnits

  const isFullWidth = layout === 'full-width'

  const gridContent = (
    <>
      <SectionHeader heading={c.heading} description={c.blurb} level="2" />
      {variant === 'table' ? (
        <Table.Root>
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeaderCell>Size</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Sq Ft</Table.ColumnHeaderCell>
              {c.showFeatures && (
                <Table.ColumnHeaderCell>Features</Table.ColumnHeaderCell>
              )}
              <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
              {c.showPricing !== false && (
                <Table.ColumnHeaderCell>Price</Table.ColumnHeaderCell>
              )}
              <Table.ColumnHeaderCell></Table.ColumnHeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {units.map((unit) => {
              const isAvailable = unit.available !== false
              return (
                <Table.Row key={unit.id}>
                  <Table.Cell>
                    <Text weight="bold">{unit.size}</Text>
                  </Table.Cell>
                  <Table.Cell>{unit.sqft} sq ft</Table.Cell>
                  {c.showFeatures && (
                    <Table.Cell>
                      {unit.features.map((f) => (
                        <Badge key={f} mr="1" size="1">{f}</Badge>
                      ))}
                    </Table.Cell>
                  )}
                  <Table.Cell>
                    <Badge
                      size="1"
                      variant={isAvailable ? 'soft' : 'surface'}
                      color={isAvailable ? 'green' : 'red'}
                    >
                      {isAvailable ? 'Available' : 'Unavailable'}
                    </Badge>
                  </Table.Cell>
                  {c.showPricing !== false && (
                    <Table.Cell>
                      <Text weight="bold">${unit.price}/mo</Text>
                    </Table.Cell>
                  )}
                  <Table.Cell>
                    {isAvailable ? (
                      <Button size="2" variant="solid" asChild>
                        <a href="?reserve">Reserve</a>
                      </Button>
                    ) : (
                      <Button size="2" variant="surface" disabled>
                        Unavailable
                      </Button>
                    )}
                  </Table.Cell>
                </Table.Row>
              )
            })}
          </Table.Body>
        </Table.Root>
      ) : (
        <Flex direction="column" gap="0">
          {units.map((unit) => {
            const isAvailable = unit.available !== false
            const formatFeature = (f: string) =>
              f.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')

            return (
              <Box
                key={unit.id}
                py="4"
                px="5"
                className="border border-[var(--gray-a4)] -mt-px first:rounded-t-[var(--radius-3)] last:rounded-b-[var(--radius-3)] bg-[var(--color-background)] hover:bg-[var(--accent-a2)] transition-colors"
              >
                <Flex
                  direction={{ initial: 'column', sm: 'row' }}
                  align={{ initial: 'start', sm: 'center' }}
                  justify="between"
                  gap="4"
                >
                  {/* Left: Size + sqft */}
                  <Flex direction="column" gap="0" className="shrink-0" style={{ minWidth: '90px' }}>
                    <Heading as="h3" size="5" weight="bold">{unit.size}</Heading>
                    <Text size="1" color="gray">{unit.sqft} sq ft</Text>
                  </Flex>

                  {/* Middle: Features as checkmark list */}
                  <Flex direction="column" gap="1" flexGrow="1" className="min-w-0">
                    {unit.features.map((f) => (
                      <Flex key={f} align="center" gap="2">
                        <Check size={14} className="text-[var(--accent-9)] shrink-0" />
                        <Text size="2">{formatFeature(f)}</Text>
                      </Flex>
                    ))}
                  </Flex>

                  {/* Right: Price + status + Reserve */}
                  <Flex align="center" gap="5" className="shrink-0">
                    {c.showPricing !== false && (
                      <Flex direction="column" align="end" gap="0">
                        <Flex align="baseline" gap="1">
                          <Text size="6" weight="bold">${unit.price}</Text>
                          <Text size="2" color="gray">/mo</Text>
                        </Flex>
                        <Text size="1" color="gray">No Obligation</Text>
                      </Flex>
                    )}
                    {isAvailable ? (
                      <Button size="3" variant="solid" highContrast asChild>
                        <a href="?reserve">Reserve Now</a>
                      </Button>
                    ) : (
                      <Button size="3" variant="surface" disabled>
                        Unavailable
                      </Button>
                    )}
                  </Flex>
                </Flex>
              </Box>
            )
          })}
        </Flex>
      )}
    </>
  )

  return (
    <Section>
      {isFullWidth ? gridContent : <Container>{gridContent}</Container>}
    </Section>
  )
}
