import { Box, Flex, Heading, Text, Separator } from '@radix-ui/themes'
import { Phone } from 'lucide-react'
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
    <Box>
      <Heading size="5" mb="2">
        {facility.name}
      </Heading>

      {reviewCount > 0 && (
        <Flex align="center" gap="1" mb="3">
          <Text size="2" color="red" weight="bold">
            Reviews
          </Text>
          <Text size="2" className="text-amber-500">
            {'★'.repeat(Math.round(avgRating))}{'☆'.repeat(5 - Math.round(avgRating))}
          </Text>
          <Text size="2" color="red" weight="bold">
            ({reviewCount})
          </Text>
        </Flex>
      )}

      <Flex direction="column" gap="1" mb="3">
        <Text size="2">{addr.street},</Text>
        <Text size="2">
          {addr.city}, {addr.state} {addr.zip}
        </Text>
        <Flex asChild align="center" gap="1">
          <a href={`tel:${info.phone}`} className="no-underline text-inherit">
            <Phone size={14} />
            <Text size="2">{info.phone}</Text>
          </a>
        </Flex>
      </Flex>

      {info.image && (
        <Box mb="4">
          <img
            src={info.image.src}
            alt={info.image.alt}
            className="w-full rounded-[var(--radius-3)] aspect-video object-cover"
          />
        </Box>
      )}

      <Separator size="4" mb="3" />

      <Box>
        <Text size="2" weight="bold" mb="2" className="block">
          Hours
        </Text>
        {info.hours.map((h, i) => (
          <Flex key={i} justify="between" mb="1">
            <Text size="2" color="gray">
              {h.days.join(', ')}
            </Text>
            <Text size="2">
              {h.open} - {h.close}
            </Text>
          </Flex>
        ))}
      </Box>
    </Box>
  )
}
