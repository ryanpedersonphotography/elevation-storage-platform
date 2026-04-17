import { Box, Flex, Heading, Text, Separator, Button, Card, Badge } from '@radix-ui/themes'
import { Phone, MapPin, Clock, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import type { FacilityConfig } from '@jerry/facility-config/schema'

interface FacilitySidebarProps {
  facility: FacilityConfig
}

export function FacilitySidebar({ facility }: FacilitySidebarProps) {
  const { info, data } = facility
  const addr = info.address
  const reviewCount = data.testimonials.length
  const avgRating =
    reviewCount > 0
      ? Math.round((data.testimonials.reduce((s, t) => s + t.rating, 0) / reviewCount) * 10) / 10
      : 0

  return (
    <Card size="3">
      {/* Facility image — full bleed at top of card */}
      {info.image && (
        <Box mx="-5" mt="-5" mb="4" className="overflow-hidden rounded-t-[var(--radius-4)]">
          <img
            src={info.image.src}
            alt={info.image.alt}
            className="w-full aspect-[4/3] object-cover"
          />
        </Box>
      )}

      {/* Name + reviews */}
      <Heading size="5" mb="1">{facility.name}</Heading>

      {reviewCount > 0 && (
        <Flex align="center" gap="2" mb="4">
          <Text size="2" color="amber" className="tracking-wide">
            {'★'.repeat(Math.round(avgRating))}{'☆'.repeat(5 - Math.round(avgRating))}
          </Text>
          <Text size="1" color="gray">
            {avgRating} ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
          </Text>
        </Flex>
      )}

      {/* Address */}
      <Flex gap="2" mb="2">
        <Box className="shrink-0 mt-0.5">
          <MapPin size={14} className="text-[var(--gray-9)]" />
        </Box>
        <Flex direction="column">
          <Text size="2">{addr.street}</Text>
          <Text size="2" color="gray">{addr.city}, {addr.state} {addr.zip}</Text>
        </Flex>
      </Flex>

      {/* Phone */}
      <Flex asChild gap="2" mb="4" align="center">
        <a href={`tel:${info.phone}`} className="no-underline text-inherit">
          <Phone size={14} className="text-[var(--gray-9)]" />
          <Text size="2" weight="medium">{info.phone}</Text>
        </a>
      </Flex>

      {/* Action buttons */}
      <Flex direction="column" gap="2" mb="4">
        <Button size="3" variant="solid" asChild>
          <Link href={`/${facility.slug}/reserve`}>Reserve a Unit</Link>
        </Button>
        {info.directionsUrl && (
          <Button size="2" variant="outline" asChild>
            <a href={info.directionsUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink size={14} />
              Get Directions
            </a>
          </Button>
        )}
      </Flex>

      <Separator size="4" />

      {/* Hours */}
      <Box mt="4">
        <Flex align="center" gap="2" mb="3">
          <Clock size={14} className="text-[var(--gray-9)]" />
          <Text size="2" weight="bold">Hours</Text>
        </Flex>
        <Flex direction="column" gap="2">
          {info.hours.map((h, i) => (
            <Flex key={i} justify="between" align="center">
              <Text size="2" color="gray">{h.days.join(', ')}</Text>
              <Badge variant="surface" size="1">{h.open} – {h.close}</Badge>
            </Flex>
          ))}
        </Flex>
      </Box>

      <Separator size="4" mt="4" />

      {/* Quick stats */}
      <Grid3Stats
        units={data.units.length}
        amenities={data.amenities.length}
        reviews={reviewCount}
      />
    </Card>
  )
}

function Grid3Stats({ units, amenities, reviews }: { units: number; amenities: number; reviews: number }) {
  return (
    <Flex mt="4" gap="0" className="divide-x divide-[var(--gray-a4)]">
      {[
        { label: 'Units', value: units },
        { label: 'Amenities', value: amenities },
        { label: 'Reviews', value: reviews },
      ].map((stat) => (
        <Flex key={stat.label} direction="column" align="center" flexGrow="1" py="2">
          <Text size="5" weight="bold">{stat.value}</Text>
          <Text size="1" color="gray">{stat.label}</Text>
        </Flex>
      ))}
    </Flex>
  )
}
