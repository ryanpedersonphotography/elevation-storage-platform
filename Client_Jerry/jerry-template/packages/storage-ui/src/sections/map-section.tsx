import React from 'react'
import { z } from 'zod'
import { Section, Container, Flex, Text, Card, Box } from '../primitives'
import { SectionHeader } from '../compositions'
import type { SectionProps } from '../renderer/registry'

export const MapSectionContentSchema = z.object({
  heading: z.string().min(1),
  blurb: z.string().optional(),
  directions: z.array(z.object({
    from: z.string(),
    steps: z.string(),
  })).optional(),
})

type MapSectionContent = z.infer<typeof MapSectionContentSchema>

export function MapSection({ content, variant = 'embedded', facilityData }: SectionProps) {
  const c = content as unknown as MapSectionContent
  const coords = facilityData?.info?.coordinates

  return (
    <Section>
      <Container>
        <SectionHeader heading={c.heading} description={c.blurb} level="2" />
        <Flex direction={{ initial: 'column', md: 'row' }} gap="5">
          {variant === 'embedded' && coords && (
            <Box style={{ flex: '1 1 0%', minHeight: '300px' }}>
              <iframe
                title="Facility location map"
                src={`https://www.google.com/maps/embed/v1/place?key=YOUR_KEY&q=${coords.lat},${coords.lng}`}
                style={{ width: '100%', height: '100%', minHeight: '300px', border: 0, borderRadius: '8px' }}
                loading="lazy"
                allowFullScreen
              />
            </Box>
          )}
          {variant === 'static' && facilityData?.info?.address && (
            <Box style={{ flex: '1 1 0%' }}>
              <Card>
                <Box p="4">
                  <Text as="p" size="3" weight="bold">Address</Text>
                  <Text as="p" size="2" mt="1">
                    {facilityData.info.address.street}
                  </Text>
                  <Text as="p" size="2">
                    {facilityData.info.address.city}, {facilityData.info.address.state} {facilityData.info.address.zip}
                  </Text>
                </Box>
              </Card>
            </Box>
          )}
          {c.directions && c.directions.length > 0 && (
            <Box style={{ flex: '1 1 0%' }}>
              {c.directions.map((dir, i) => (
                <Card key={i} mb="3">
                  <Box p="4">
                    <Text as="p" size="2" weight="bold">From {dir.from}</Text>
                    <Text as="p" size="2" mt="1" color="gray">{dir.steps}</Text>
                  </Box>
                </Card>
              ))}
            </Box>
          )}
        </Flex>
      </Container>
    </Section>
  )
}
