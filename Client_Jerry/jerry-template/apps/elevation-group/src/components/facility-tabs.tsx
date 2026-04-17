'use client'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Flex, Box, Text } from '@radix-ui/themes'
import type { FacilityConfig } from '@jerry/facility-config/schema'

interface FacilityTabsProps {
  facility: FacilityConfig
}

const tabLabels: Record<string, string> = {
  home: 'Available Units',
  units: 'Available Units',
  amenities: 'Facility Features',
  reserve: 'Reserve',
  directions: 'Map/Directions',
  faq: 'FAQ',
  reviews: 'Reviews',
}

export function FacilityTabs({ facility }: FacilityTabsProps) {
  const pathname = usePathname()
  const enabledPages = Object.entries(facility.pages).filter(([, p]) => p.enabled)

  return (
    <Flex gap="0" mb="5" className="border-b border-[var(--gray-a5)] overflow-x-auto">
      {enabledPages.map(([slug]) => {
        const href = slug === 'home' ? `/${facility.slug}` : `/${facility.slug}/${slug}`
        const isActive =
          slug === 'home'
            ? pathname === `/${facility.slug}` || pathname === `/${facility.slug}/`
            : pathname === href
        const label =
          tabLabels[slug] ?? slug.charAt(0).toUpperCase() + slug.slice(1)

        return (
          <Link key={slug} href={href} className="no-underline text-inherit shrink-0">
            <Box
              px="4"
              py="3"
              className={
                isActive
                  ? 'border-b-2 border-[var(--accent-9)]'
                  : 'border-b-2 border-transparent hover:border-[var(--gray-a5)]'
              }
            >
              <Text
                size="2"
                weight={isActive ? 'bold' : 'regular'}
                color={isActive ? undefined : 'gray'}
              >
                {label}
              </Text>
            </Box>
          </Link>
        )
      })}
    </Flex>
  )
}
