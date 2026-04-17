'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Flex, Text, Button, Box, IconButton, Container, Separator } from '@radix-ui/themes'
import type { FacilityConfig } from '@jerry/facility-config/schema'
import { Menu, X, Phone, MapPin, Clock, User } from 'lucide-react'

interface NavProps {
  facility: FacilityConfig
}

export function Nav({ facility }: NavProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const enabledPages = Object.entries(facility.pages).filter(
    ([, page]) => page.enabled
  )

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <Box asChild>
      <header>
        {/* ── Utility bar ── */}
        <Box className="bg-[var(--gray-12)] text-[var(--gray-1)]">
          <Container size="3">
            <Flex justify="between" align="center" py="1" gap="4">
              <Flex gap="4" align="center">
                <Flex asChild align="center" gap="1">
                  <a href={`tel:${facility.info.phone}`} className="no-underline text-inherit">
                    <Phone size={12} />
                    <Text size="1">{facility.info.phone}</Text>
                  </a>
                </Flex>
                <Flex align="center" gap="1" className="hidden sm:flex">
                  <MapPin size={12} />
                  <Text size="1">
                    {facility.info.address.city}, {facility.info.address.state}
                  </Text>
                </Flex>
              </Flex>
              <Flex gap="3" align="center">
                <Flex align="center" gap="1" className="hidden sm:flex">
                  <Clock size={12} />
                  <Text size="1">
                    Open today until {facility.info.hours[0]?.close ?? '9pm'}
                  </Text>
                </Flex>
                <Text size="1" className="hidden sm:block text-[var(--gray-8)]">|</Text>
                <Flex asChild align="center" gap="1">
                  <a href={`/${facility.slug}/reserve`} className="no-underline text-inherit">
                    <User size={12} />
                    <Text size="1">Pay Bill</Text>
                  </a>
                </Flex>
              </Flex>
            </Flex>
          </Container>
        </Box>

        {/* ── Main navigation ── */}
        <Box
          asChild
          className={[
            'sticky top-0 z-50 bg-[var(--color-background)] transition-shadow',
            scrolled ? 'shadow-md' : 'shadow-sm',
          ].join(' ')}
        >
          <nav aria-label="Main navigation">
            <Container size="3">
              <Flex justify="between" align="center" py="3" gap="5">
                {/* Logo */}
                <Link href={`/${facility.slug}`} className="no-underline text-inherit shrink-0">
                  <Flex align="center" gap="2">
                    <Text size="5" weight="bold" className="tracking-tight">
                      {facility.name}
                    </Text>
                    {facility.branding.showParent && (
                      <Text size="1" color="gray" className="hidden lg:block">
                        An Elevation Group Property
                      </Text>
                    )}
                  </Flex>
                </Link>

                {/* Desktop nav links */}
                <Flex asChild gap="1" align="center" className="hidden md:flex">
                  <ul className="list-none m-0 p-0">
                    {enabledPages.map(([slug]) => {
                      const href = slug === 'home' ? `/${facility.slug}` : `/${facility.slug}/${slug}`
                      const label = slug.charAt(0).toUpperCase() + slug.slice(1)
                      return (
                        <li key={slug}>
                          <Button asChild variant="ghost" size="2">
                            <Link href={href}>{label}</Link>
                          </Button>
                        </li>
                      )
                    })}
                  </ul>
                </Flex>

                {/* Desktop CTA */}
                <Flex gap="3" align="center" className="hidden md:flex shrink-0">
                  <Button size="2" variant="solid" highContrast asChild>
                    <Link href={`/${facility.slug}/reserve`}>Reserve Now</Link>
                  </Button>
                </Flex>

                {/* Mobile: phone icon + hamburger */}
                <Flex gap="2" align="center" className="flex md:hidden">
                  <IconButton variant="ghost" size="2" asChild>
                    <a href={`tel:${facility.info.phone}`} aria-label="Call us">
                      <Phone size={18} />
                    </a>
                  </IconButton>
                  <IconButton
                    variant="ghost"
                    size="3"
                    onClick={() => setMobileOpen(!mobileOpen)}
                    aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
                    aria-expanded={mobileOpen}
                  >
                    {mobileOpen ? <X size={20} /> : <Menu size={20} />}
                  </IconButton>
                </Flex>
              </Flex>
            </Container>

            {/* Mobile slide-down menu */}
            {mobileOpen && (
              <Box className="md:hidden border-t border-[var(--gray-a4)] bg-[var(--color-background)]">
                <Container size="3">
                  <Flex direction="column" gap="1" py="3">
                    {enabledPages.map(([slug]) => {
                      const href = slug === 'home' ? `/${facility.slug}` : `/${facility.slug}/${slug}`
                      const label = slug.charAt(0).toUpperCase() + slug.slice(1)
                      return (
                        <Button
                          key={slug}
                          asChild
                          variant="ghost"
                          size="3"
                          className="justify-start"
                          onClick={() => setMobileOpen(false)}
                        >
                          <Link href={href}>{label}</Link>
                        </Button>
                      )
                    })}
                    <Separator size="4" my="2" />
                    <Flex align="center" gap="2" py="2">
                      <Phone size={14} className="text-[var(--gray-9)]" />
                      <a href={`tel:${facility.info.phone}`} className="no-underline text-inherit">
                        <Text size="2" weight="medium">{facility.info.phone}</Text>
                      </a>
                    </Flex>
                    <Button size="3" variant="solid" highContrast asChild>
                      <Link href={`/${facility.slug}/reserve`}>Reserve Now</Link>
                    </Button>
                  </Flex>
                </Container>
              </Box>
            )}
          </nav>
        </Box>
      </header>
    </Box>
  )
}
