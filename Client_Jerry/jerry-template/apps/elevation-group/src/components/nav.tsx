'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import { Flex, Text, Button, Box, IconButton } from '@radix-ui/themes'
import type { FacilityConfig } from '@jerry/facility-config'
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
    <Box
      asChild
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backgroundColor: 'white',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      }}
    >
      <nav>
        <Flex
          justify="between"
          align="center"
          px="5"
          py="3"
          style={{ maxWidth: '1200px', margin: '0 auto' }}
        >
          <Flex align="center" gap="3">
            <Link href={`/${facility.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <Text size="5" weight="bold">{facility.name}</Text>
            </Link>
            {facility.branding.showParent && (
              <Box display={{ initial: 'none', md: 'block' }}>
                <Text size="1" color="gray">
                  An Elevation Group Property
                </Text>
              </Box>
            )}
          </Flex>

          <Flex gap="1" align="center" display={{ initial: 'none', md: 'flex' }}>
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

          <Flex gap="3" align="center" display={{ initial: 'none', md: 'flex' }}>
            <a href={`tel:${facility.info.phone}`} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Phone size={14} />
              <Text size="2" weight="medium">{facility.info.phone}</Text>
            </a>
            <Button size="2" variant="solid" asChild>
              <Link href={`/${facility.slug}/reserve`}>Reserve Now</Link>
            </Button>
          </Flex>

          <Box display={{ initial: 'block', md: 'none' }}>
            <IconButton variant="ghost" size="3" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </IconButton>
          </Box>
        </Flex>

        {mobileOpen && (
          <Box px="5" pb="4" display={{ initial: 'block', md: 'none' }}>
            <Flex direction="column" gap="2">
              {enabledPages.map(([slug]) => {
                const href = slug === 'home' ? `/${facility.slug}` : `/${facility.slug}/${slug}`
                const label = slug.charAt(0).toUpperCase() + slug.slice(1)
                return (
                  <Button key={slug} asChild variant="ghost" size="2" onClick={() => setMobileOpen(false)}>
                    <Link href={href}>{label}</Link>
                  </Button>
                )
              })}
              <a href={`tel:${facility.info.phone}`} style={{ textDecoration: 'none', color: 'inherit', padding: '0.5rem 0' }}>
                <Text size="2" weight="bold">{facility.info.phone}</Text>
              </a>
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
