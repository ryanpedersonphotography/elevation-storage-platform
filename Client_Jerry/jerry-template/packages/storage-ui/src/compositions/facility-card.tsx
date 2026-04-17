import React from 'react'
import { Card, Heading, Text, Box, Flex, Button, Badge } from '../primitives'
import { Image } from '../primitives'
import type { FacilityConfig } from '@jerry/facility-config/schema'

export interface FacilityCardProps {
  facility: FacilityConfig
  href: string
}

export function FacilityCard({ facility, href }: FacilityCardProps) {
  const { info, data } = facility
  const addr = info.address
  const reviewCount = data.testimonials.length
  const unitCount = data.units.length
  const facilityImage = info.image
  const directionsUrl = info.directionsUrl

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${addr.street}+${addr.city}+${addr.state}+${addr.zip}`

  return (
    <Card style={{ overflow: 'hidden' }}>
      {facilityImage && (
        <Image src={facilityImage.src} alt={facilityImage.alt} aspect="16/9" />
      )}
      <Box p="4">
        <Heading as="h3" size="4" mb="2">{facility.name}</Heading>
        <Flex direction="column" gap="1" mb="3">
          <Text as="p" size="2" color="gray">{addr.street}</Text>
          <Text as="p" size="2" color="gray">{addr.city}, {addr.state} {addr.zip}</Text>
        </Flex>
        <Box mb="3">
          <a href={`tel:${info.phone}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <Text as="span" size="2" weight="bold">{info.phone}</Text>
          </a>
        </Box>
        <Flex gap="2" mb="3" wrap="wrap">
          <Button variant="outline" size="2" asChild>
            <a href={directionsUrl ?? googleMapsUrl} target="_blank" rel="noopener noreferrer">
              Get Directions
            </a>
          </Button>
          <Button variant="solid" size="2" asChild>
            <a href={href}>View Facility</a>
          </Button>
        </Flex>
        <Flex justify="between" align="center">
          {reviewCount > 0 && (
            <Badge size="1" variant="soft">Reviews ({reviewCount})</Badge>
          )}
          {unitCount > 0 && (
            <a href={`${href}/units`} style={{ textDecoration: 'none' }}>
              <Text as="span" size="2" weight="bold" style={{ color: 'var(--accent-9)' }}>
                Available Units
              </Text>
            </a>
          )}
        </Flex>
      </Box>
    </Card>
  )
}
