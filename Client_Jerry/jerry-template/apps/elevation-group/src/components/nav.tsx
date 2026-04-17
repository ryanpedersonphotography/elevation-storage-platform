'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Flex, Text, Button, Box, IconButton, Container, Separator } from '@radix-ui/themes'
import type { FacilityConfig } from '@jerry/facility-config/schema'
import { Menu, X, Phone, User } from 'lucide-react'

interface NavProps {
  facility: FacilityConfig
}

/** Only show the most important nav items — keep the header clean */
const primarySlugs = ['units', 'amenities', 'reserve', 'directions']

export function Nav({ facility }: NavProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  const allPages = Object.entries(facility.pages).filter(([, p]) => p.enabled)
  const navPages = allPages.filter(([slug]) => primarySlugs.includes(slug))

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 48)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <Box asChild>
      <header>
        {/* ── Main navigation ── */}
        <Box
          asChild
          className={[
            'sticky top-0 z-50 bg-[var(--color-background)] border-b border-[var(--gray-a4)]',
            scrolled ? 'shadow-md' : '',
          ].join(' ')}
        >
          <nav aria-label="Main navigation">
            <Container size="3">
              <Flex justify="between" align="center" className="h-16" gap="6">
                {/* Logo — clean and prominent */}
                <Link href={`/${facility.slug}`} className="no-underline text-inherit shrink-0">
                  <Text size="5" weight="bold" className="tracking-tight">
                    {facility.name}
                  </Text>
                </Link>

                {/* Desktop nav — fewer links, bigger text, generous gap */}
                <Flex asChild gap="5" align="center" className="hidden md:flex">
                  <ul className="list-none m-0 p-0">
                    {navPages.map(([slug]) => {
                      const href = `/${facility.slug}/${slug}`
                      const label = slug === 'units' ? 'Find Storage'
                        : slug === 'amenities' ? 'Features'
                        : slug === 'directions' ? 'Directions'
                        : slug.charAt(0).toUpperCase() + slug.slice(1)
                      return (
                        <li key={slug}>
                          <Link href={href} className="no-underline text-inherit">
                            <Text size="3" weight="medium" color="gray" className="hover:text-[var(--gray-12)] transition-colors">
                              {label}
                            </Text>
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                </Flex>

                {/* Right side — phone, account, CTA, hamburger */}
                <Flex gap="4" align="center" className="shrink-0">
                  {/* Phone — desktop only, plain text */}
                  <a href={`tel:${facility.info.phone}`} className="no-underline text-inherit hidden lg:block">
                    <Text size="3" weight="medium">{facility.info.phone}</Text>
                  </a>

                  {/* Account icon — desktop */}
                  <IconButton variant="ghost" size="2" className="hidden md:flex" asChild>
                    <a href={`/${facility.slug}/reserve`} aria-label="Account">
                      <User size={20} />
                    </a>
                  </IconButton>

                  {/* Pay Bill — outlined button */}
                  <Button variant="outline" size="2" className="hidden md:flex" asChild>
                    <Link href={`/${facility.slug}/reserve`}>Pay Bill</Link>
                  </Button>

                  {/* Mobile phone icon */}
                  <IconButton variant="ghost" size="2" className="flex md:hidden" asChild>
                    <a href={`tel:${facility.info.phone}`} aria-label="Call us">
                      <Phone size={20} />
                    </a>
                  </IconButton>

                  {/* Hamburger — always visible, mimics Public Storage pattern */}
                  <IconButton
                    variant="ghost"
                    size="3"
                    onClick={() => setMobileOpen(!mobileOpen)}
                    aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
                    aria-expanded={mobileOpen}
                  >
                    {mobileOpen ? <X size={22} /> : <Menu size={22} />}
                  </IconButton>
                </Flex>
              </Flex>
            </Container>

            {/* Slide-down menu (hamburger) */}
            {mobileOpen && (
              <Box className="border-t border-[var(--gray-a4)] bg-[var(--color-background)]">
                <Container size="3">
                  <Flex direction="column" py="4" gap="1">
                    {allPages.map(([slug]) => {
                      const href = slug === 'home' ? `/${facility.slug}` : `/${facility.slug}/${slug}`
                      const label = slug.charAt(0).toUpperCase() + slug.slice(1)
                      return (
                        <Link
                          key={slug}
                          href={href}
                          className="no-underline text-inherit block py-2 hover:bg-[var(--gray-a2)] rounded-[var(--radius-2)] px-3 transition-colors"
                          onClick={() => setMobileOpen(false)}
                        >
                          <Text size="3" weight="medium">{label}</Text>
                        </Link>
                      )
                    })}

                    <Separator size="4" my="2" />

                    <Flex align="center" gap="2" px="3" py="2">
                      <Phone size={16} className="text-[var(--gray-9)]" />
                      <a href={`tel:${facility.info.phone}`} className="no-underline text-inherit">
                        <Text size="3" weight="medium">{facility.info.phone}</Text>
                      </a>
                    </Flex>

                    <Flex gap="3" px="3" pt="2">
                      <Box flexGrow="1">
                        <Button size="3" variant="solid" highContrast className="w-full" asChild>
                          <Link href={`/${facility.slug}/reserve`}>Reserve Now</Link>
                        </Button>
                      </Box>
                      <Box flexGrow="1">
                        <Button size="3" variant="outline" className="w-full" asChild>
                          <Link href={`/${facility.slug}/reserve`}>Pay Bill</Link>
                        </Button>
                      </Box>
                    </Flex>
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
