'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import { Flex, Text, Button, Box, IconButton, Separator } from '@radix-ui/themes'
import type { FacilityConfig } from '@jerry/facility-config/schema'
import { Menu, X, Phone } from 'lucide-react'

interface NavProps {
  facility: FacilityConfig
}

export function Nav({ facility }: NavProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <Box asChild>
      <header>
        <Box
          asChild
          className="sticky top-0 z-50"
        >
          <nav aria-label="Main navigation">
            <Box className="bg-[var(--gray-12)]">
              <Flex justify="between" align="center" className="h-14 max-w-7xl mx-auto px-8">
                <Link href="/" className="no-underline">
                  <Text size="5" weight="bold" className="text-white">
                    Elevation Group
                  </Text>
                </Link>
                <Flex gap="5" align="center" className="hidden sm:flex">
                  <Link href="/#locations" className="no-underline">
                    <Text size="2" className="text-[var(--gray-6)] hover:text-white transition-colors">Locations</Text>
                  </Link>
                  <Link href="/#contact" className="no-underline">
                    <Text size="2" className="text-[var(--gray-6)] hover:text-white transition-colors">Contact</Text>
                  </Link>
                  <a href={`tel:${facility.info.phone}`} className="no-underline">
                    <Text size="2" className="text-[var(--gray-6)] hover:text-white transition-colors">{facility.info.phone}</Text>
                  </a>
                </Flex>
                <Flex gap="3" align="center" className="sm:hidden">
                  <IconButton variant="ghost" size="2" asChild>
                    <a href={`tel:${facility.info.phone}`} aria-label="Call us" className="text-white">
                      <Phone size={18} />
                    </a>
                  </IconButton>
                  <IconButton
                    variant="ghost"
                    size="2"
                    onClick={() => setMobileOpen(!mobileOpen)}
                    aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
                    aria-expanded={mobileOpen}
                    className="text-white"
                  >
                    {mobileOpen ? <X size={20} /> : <Menu size={20} />}
                  </IconButton>
                </Flex>
              </Flex>
            </Box>

            {/* Mobile menu */}
            {mobileOpen && (
              <Box className="bg-[var(--gray-12)] border-t border-[var(--gray-10)]">
                <Flex direction="column" py="3" gap="1" className="max-w-7xl mx-auto px-8">
                  <Link href="/#locations" className="no-underline block py-2 px-3" onClick={() => setMobileOpen(false)}>
                    <Text size="3" className="text-white">All Locations</Text>
                  </Link>
                  <Link href="/#contact" className="no-underline block py-2 px-3" onClick={() => setMobileOpen(false)}>
                    <Text size="3" className="text-white">Contact</Text>
                  </Link>
                  <Separator size="4" my="2" className="bg-[var(--gray-10)]" />
                  <Flex gap="3" px="3" pt="1">
                    <Box flexGrow="1">
                      <Button size="3" variant="solid" highContrast className="w-full" asChild>
                        <Link href={`/${facility.slug}/reserve`}>Reserve Now</Link>
                      </Button>
                    </Box>
                  </Flex>
                </Flex>
              </Box>
            )}
          </nav>
        </Box>
      </header>
    </Box>
  )
}
