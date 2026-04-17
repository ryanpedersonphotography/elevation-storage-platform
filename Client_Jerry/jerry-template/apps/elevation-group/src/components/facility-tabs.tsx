'use client'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Flex, Box, Text } from '@radix-ui/themes'
import type { FacilityConfig } from '@jerry/facility-config/schema'

interface FacilityTabsProps {
  facility: FacilityConfig
}

const tabLabels: Record<string, string> = {
  home: 'Overview',
  units: 'Available Units',
  amenities: 'Facility Features',
  reserve: 'Reserve',
  directions: 'Map / Directions',
  faq: 'FAQ',
  reviews: 'Reviews',
}

export function FacilityTabs({ facility }: FacilityTabsProps) {
  const pathname = usePathname()
  const enabledPages = Object.entries(facility.pages).filter(([, p]) => p.enabled)

  return (
    <Box className="border-b-2 border-[var(--gray-a4)] mb-6">
      <Flex gap="0" className="overflow-x-auto -mb-[2px]">
        {enabledPages.map(([slug]) => {
          const href = slug === 'home' ? `/${facility.slug}` : `/${facility.slug}/${slug}`
          const isActive =
            slug === 'home'
              ? pathname === `/${facility.slug}` || pathname === `/${facility.slug}/`
              : pathname === href
          const label = tabLabels[slug] ?? slug.charAt(0).toUpperCase() + slug.slice(1)

          return (
            <Link key={slug} href={href} className="no-underline text-inherit shrink-0">
              <Box
                px="4"
                py="3"
                className={
                  isActive
                    ? 'border-b-2 border-[var(--accent-9)] bg-[var(--accent-a2)]'
                    : 'border-b-2 border-transparent hover:bg-[var(--gray-a2)] transition-colors'
                }
              >
                <Text
                  size="2"
                  weight={isActive ? 'bold' : 'medium'}
                  color={isActive ? undefined : 'gray'}
                >
                  {label}
                </Text>
              </Box>
            </Link>
          )
        })}
      </Flex>
    </Box>
  )
}
