import React from 'react'
import { Card, Heading, Text, Box, Flex, Button, Badge } from '../primitives'
import { Image } from '../primitives'
import { Phone, MapPin, ArrowRight } from 'lucide-react'
import type { FacilityConfig } from '@jerry/facility-config/schema'

export interface FacilityCardProps {
  facility: FacilityConfig
  href: string
}

export function FacilityCard({ facility, href }: FacilityCardProps) {
  const { info, data } = facility
  const addr = info.address
  const reviewCount = data.testimonials.length
  const avgRating =
    reviewCount > 0
      ? Math.round((data.testimonials.reduce((s, t) => s + t.rating, 0) / reviewCount) * 10) / 10
      : 0
  const unitCount = data.units.length
  const availableCount = data.units.filter((u) => u.available !== false).length
  const lowestPrice = data.units.length > 0
    ? Math.min(...data.units.filter((u) => u.available !== false).map((u) => u.price))
    : null
  const facilityImage = info.image
  const directionsUrl = info.directionsUrl
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${addr.street}+${addr.city}+${addr.state}+${addr.zip}`

  // Collect unique features across all units
  const allFeatures = Array.from(new Set(data.units.flatMap((u) => u.features)))
  const formatFeature = (f: string) =>
    f.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')

  // Size range
  const sizes = data.units.map((u) => u.size)
  const sizeRange = sizes.length > 0
    ? sizes.length === 1 ? sizes[0] : `${sizes[0]} to ${sizes[sizes.length - 1]}`
    : null

  return (
    <Card style={{ overflow: 'hidden', padding: 0 }}>
      {/* Image with overlaid badges */}
      <Box style={{ position: 'relative', height: '180px', background: 'var(--gray-3)' }}>
        {facilityImage && (
          <img
            src={facilityImage.src}
            alt={facilityImage.alt}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        )}

        {/* Feature chip — top left */}
        {allFeatures.length > 0 && (
          <Box
            style={{
              position: 'absolute', top: '12px', left: '12px',
              background: 'rgba(255,255,255,0.95)', borderRadius: '999px',
              padding: '4px 11px', fontSize: '11px', fontWeight: 500,
              color: 'var(--gray-12)',
            }}
          >
            {formatFeature(allFeatures[0])}
          </Box>
        )}

        {/* Price badge — bottom left */}
        {lowestPrice !== null && (
          <Flex
            align="baseline"
            gap="1"
            style={{
              position: 'absolute', bottom: '12px', left: '12px',
              background: 'rgba(255,255,255,0.95)', borderRadius: 'var(--radius-2)',
              padding: '5px 12px',
            }}
          >
            <Text size="1" color="gray">From</Text>
            <Text size="3" weight="medium">${lowestPrice}</Text>
            <Text size="1" color="gray">/mo</Text>
          </Flex>
        )}
      </Box>

      {/* Card body */}
      <Box px="4" pt="3" pb="4">
        {/* Name */}
        <Heading as="h3" size="3" weight="medium" mb="1">{facility.name}</Heading>

        {/* Rating */}
        {reviewCount > 0 && (
          <Flex align="center" gap="1" mb="2">
            <Text size="2" color="amber" style={{ letterSpacing: '1px' }}>
              {'★'.repeat(Math.round(avgRating))}{'☆'.repeat(5 - Math.round(avgRating))}
            </Text>
            <Text size="2" weight="medium">{avgRating}</Text>
            <Text size="2" color="gray">({reviewCount})</Text>
          </Flex>
        )}

        {/* Address */}
        <Text as="p" size="2" color="gray" mb="3" style={{ lineHeight: 1.5 }}>
          {addr.street}, {addr.city}, {addr.state}
        </Text>

        {/* Feature chips */}
        <Flex gap="1" wrap="wrap" mb="3">
          {allFeatures.slice(0, 3).map((f) => (
            <Badge key={f} size="1" variant="surface" style={{ borderRadius: '999px' }}>
              {formatFeature(f)}
            </Badge>
          ))}
          {sizeRange && (
            <Badge size="1" variant="surface" style={{ borderRadius: '999px' }}>
              {sizeRange}
            </Badge>
          )}
        </Flex>

        {/* Phone + Directions */}
        <Flex gap="4" mb="3" pb="3" style={{ borderBottom: '1px solid var(--gray-a4)' }}>
          <a href={`tel:${info.phone}`} style={{ textDecoration: 'none', color: 'inherit', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
            <Phone size={13} style={{ color: 'var(--gray-9)' }} />
            <Text size="1" color="gray">{info.phone}</Text>
          </a>
          <a href={directionsUrl ?? googleMapsUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
            <MapPin size={13} style={{ color: 'var(--gray-9)' }} />
            <Text size="1" color="gray">Get directions</Text>
          </a>
        </Flex>

        {/* CTA buttons */}
        <Flex gap="2">
          <Button variant="outline" size="2" asChild style={{ flex: 1 }}>
            <a href={href}>View facility</a>
          </Button>
          <Button variant="solid" size="2" highContrast asChild style={{ flex: 1.4 }}>
            <a href={`${href}/units`} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              {availableCount > 0 ? `${availableCount} units available` : 'View units'}
              <ArrowRight size={14} />
            </a>
          </Button>
        </Flex>
      </Box>
    </Card>
  )
}
