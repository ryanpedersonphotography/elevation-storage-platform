'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import { Flex, Text, Button, Box, IconButton, Container } from '@radix-ui/themes'
import type { FacilityConfig } from '@jerry/facility-config/schema'
import { Menu, X, Phone } from 'lucide-react'

interface NavProps {
  facility: FacilityConfig
}

export function Nav({ facility }: NavProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const enabledPages = Object.entries(facility.pages).filter(
    ([, page]) => page.enabled
  )

  return (
    <Box asChild className="sticky top-0 z-50 bg-[var(--color-background)] shadow-sm">
      <nav>
        <Container size="3">
          <Flex justify="between" align="center" py="3" gap="4">
            {/* Logo */}
            <Flex align="center" gap="3" className="shrink-0">
              <Link href={`/${facility.slug}`} className="no-underline text-inherit">
                <Text size="5" weight="bold">{facility.name}</Text>
              </Link>
              {facility.branding.showParent && (
                <Text size="1" color="gray" className="hidden sm:block">
                  An Elevation Group Property
                </Text>
              )}
            </Flex>

            {/* Desktop nav links */}
            <Flex gap="1" align="center" className="hidden sm:flex">
              {enabledPages.map(([slug]) => {
                const href = slug === 'home' ? `/${facility.slug}` : `/${facility.slug}/${slug}`
                const label = slug.charAt(0).toUpperCase() + slug.slice(1)
                return (
                  <Button key={slug} asChild variant="ghost" size="2">
                    <Link href={href}>{label}</Link>
                  </Button>
                )
              })}
            </Flex>

            {/* Desktop phone + CTA */}
            <Flex gap="3" align="center" className="hidden sm:flex shrink-0">
              <Flex asChild align="center" gap="1">
                <a href={`tel:${facility.info.phone}`} className="no-underline text-inherit">
                  <Phone size={14} />
                  <Text size="2" weight="medium">{facility.info.phone}</Text>
                </a>
              </Flex>
              <Button size="2" variant="solid" asChild>
                <Link href={`/${facility.slug}/reserve`}>Reserve Now</Link>
              </Button>
            </Flex>

            {/* Mobile hamburger */}
            <Box className="block sm:hidden">
              <IconButton variant="ghost" size="3" onClick={() => setMobileOpen(!mobileOpen)}>
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
              </IconButton>
            </Box>
          </Flex>
        </Container>

        {/* Mobile drawer */}
        {mobileOpen && (
          <Box px="5" pb="4" className="block sm:hidden border-t border-[var(--gray-a4)]">
            <Flex direction="column" gap="2" pt="3">
              {enabledPages.map(([slug]) => {
                const href = slug === 'home' ? `/${facility.slug}` : `/${facility.slug}/${slug}`
                const label = slug.charAt(0).toUpperCase() + slug.slice(1)
                return (
                  <Button key={slug} asChild variant="ghost" size="2" onClick={() => setMobileOpen(false)}>
                    <Link href={href}>{label}</Link>
                  </Button>
                )
              })}
              <Flex asChild align="center" gap="1" py="2">
                <a href={`tel:${facility.info.phone}`} className="no-underline text-inherit">
                  <Phone size={14} />
                  <Text size="2" weight="bold">{facility.info.phone}</Text>
                </a>
              </Flex>
              <Button size="2" variant="solid" asChild>
                <Link href={`/${facility.slug}/reserve`}>Reserve Now</Link>
              </Button>
            </Flex>
          </Box>
        )}
      </nav>
    </Box>
  )
}
