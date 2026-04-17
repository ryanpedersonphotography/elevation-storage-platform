'use client'

import { useEffect, useState, useRef } from 'react'
import { Box, Flex, Heading, Text, Button, Badge, ScrollArea } from '@radix-ui/themes'
import { X, MapPin, Phone, Clock, ExternalLink, Package, Shield, MessageSquare, HelpCircle, ChevronDown } from 'lucide-react'
import Link from 'next/link'
import type { FacilityConfig } from '@jerry/facility-config/schema'

export interface FacilityDrawerProps {
  facility: FacilityConfig | null
  open: boolean
  onClose: () => void
}

export function FacilityDrawer({ facility, open, onClose }: FacilityDrawerProps) {
  // Keep last facility visible during slide-out animation
  const [rendered, setRendered] = useState(false)
  const lastFacility = useRef<FacilityConfig | null>(null)

  if (facility) lastFacility.current = facility

  useEffect(() => {
    if (open) {
      setRendered(true)
    } else {
      const timer = setTimeout(() => setRendered(false), 350)
      return () => clearTimeout(timer)
    }
  }, [open])

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = ''
      }
    }
  }, [open])

  // Close on Escape key
  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  const displayFacility = facility ?? lastFacility.current
  if (!rendered || !displayFacility) return null

  const { info, data } = displayFacility
  const addr = info.address
  const reviewCount = data.testimonials.length
  const avgRating =
    reviewCount > 0
      ? Math.round((data.testimonials.reduce((s, t) => s + t.rating, 0) / reviewCount) * 10) / 10
      : 0

  return (
    <>
      {/* Overlay */}
      <Box
        position="fixed"
        inset="0"
        className={[
          'z-50 transition-opacity duration-300',
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        ].join(' ')}
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
        onClick={onClose}
      />

      {/* Drawer panel */}
      <Box
        position="fixed"
        className={[
          'z-50 top-0 right-0 h-full w-[400px] max-w-[90vw] shadow-2xl',
          'transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]',
          open ? 'translate-x-0' : 'translate-x-full',
        ].join(' ')}
        style={{ backgroundColor: 'var(--color-panel-solid)' }}
      >
        {/* Close button */}
        <Box position="absolute" className="top-3 right-3 z-10">
          <Button
            size="1"
            variant="ghost"
            color="gray"
            onClick={onClose}
            aria-label="Close drawer"
            style={{ cursor: 'pointer' }}
          >
            <X size={18} />
          </Button>
        </Box>

        <ScrollArea scrollbars="vertical" style={{ height: '100%' }}>
          <Flex direction="column" gap="3" p="4">
            {/* Facility image */}
            {info.image && (
              <Box mx="-4" mt="-4" className="overflow-hidden">
                <img
                  src={info.image.src}
                  alt={info.image.alt}
                  className="w-full aspect-[16/9] object-cover"
                />
              </Box>
            )}

            {/* Name */}
            <Heading size="4" mt={info.image ? '1' : '4'}>{displayFacility.name}</Heading>

            {/* Rating + reviews */}
            {reviewCount > 0 && (
              <Flex align="center" gap="2">
                <Text size="2" color="amber" className="tracking-wide">
                  {'★'.repeat(Math.round(avgRating))}{'☆'.repeat(5 - Math.round(avgRating))}
                </Text>
                <Text size="1" color="gray">
                  {avgRating} ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
                </Text>
              </Flex>
            )}

            {/* Address */}
            <Flex gap="2" align="start">
              <Box className="shrink-0 mt-0.5">
                <MapPin size={14} className="text-[var(--gray-9)]" />
              </Box>
              <Flex direction="column">
                <Text size="2">{addr.street}</Text>
                <Text size="2" color="gray">{addr.city}, {addr.state} {addr.zip}</Text>
              </Flex>
            </Flex>

            {/* Phone */}
            <Flex asChild gap="2" align="center">
              <a href={`tel:${info.phone}`} className="no-underline text-inherit">
                <Phone size={14} className="text-[var(--gray-9)]" />
                <Text size="2" weight="medium">{info.phone}</Text>
              </a>
            </Flex>

            {/* Hours */}
            <Flex direction="column" gap="1">
              <Flex align="center" gap="2">
                <Clock size={14} className="text-[var(--gray-9)]" />
                <Text size="2" weight="bold">Hours</Text>
              </Flex>
              {info.hours.map((h, i) => (
                <Flex key={i} justify="between" align="center" pl="5">
                  <Text size="1" color="gray">{h.days.join(', ')}</Text>
                  <Badge variant="surface" size="1">{h.open} – {h.close}</Badge>
                </Flex>
              ))}
            </Flex>

            {/* Quick stats */}
            <Flex gap="0" className="divide-x divide-[var(--gray-a4)]">
              {[
                { label: 'Units', value: data.units.length },
                { label: 'Amenities', value: data.amenities.length },
                { label: 'Reviews', value: reviewCount },
              ].map((stat) => (
                <Flex key={stat.label} direction="column" align="center" flexGrow="1" py="2">
                  <Text size="4" weight="bold">{stat.value}</Text>
                  <Text size="1" color="gray">{stat.label}</Text>
                </Flex>
              ))}
            </Flex>

            {/* ── Units ── */}
            {data.units.length > 0 && (
              <Box>
                <Flex align="center" gap="2" mb="2">
                  <Package size={14} className="text-[var(--gray-9)]" />
                  <Text size="2" weight="bold">Available Units</Text>
                </Flex>
                <Flex direction="column" gap="1">
                  {data.units.map((unit) => (
                    <Flex key={unit.id} justify="between" align="center" py="1" px="2"
                      className="rounded-[var(--radius-2)] hover:bg-[var(--gray-a2)]"
                    >
                      <Flex align="center" gap="2">
                        <Text size="2" weight="medium">{unit.size}</Text>
                        <Text size="1" color="gray">{unit.sqft} sq ft</Text>
                      </Flex>
                      <Flex align="center" gap="2">
                        <Text size="2" weight="bold">${unit.price}<Text as="span" size="1" color="gray">/mo</Text></Text>
                        {unit.available !== false && (
                          <Badge size="1" variant="soft" color="green">Open</Badge>
                        )}
                      </Flex>
                    </Flex>
                  ))}
                </Flex>
              </Box>
            )}

            {/* ── Amenities ── */}
            {data.amenities.length > 0 && (
              <Box>
                <Flex align="center" gap="2" mb="2">
                  <Shield size={14} className="text-[var(--gray-9)]" />
                  <Text size="2" weight="bold">Facility Features</Text>
                </Flex>
                <Flex direction="column" gap="1">
                  {data.amenities.map((amenity) => (
                    <Flex key={amenity.id} direction="column" py="1" px="2">
                      <Text size="2" weight="medium">{amenity.label}</Text>
                      <Text size="1" color="gray">{amenity.description}</Text>
                    </Flex>
                  ))}
                </Flex>
              </Box>
            )}

            {/* ── FAQ ── */}
            {data.faq && data.faq.length > 0 && (
              <Box>
                <Flex align="center" gap="2" mb="2">
                  <HelpCircle size={14} className="text-[var(--gray-9)]" />
                  <Text size="2" weight="bold">FAQ</Text>
                </Flex>
                <Flex direction="column" gap="1">
                  {data.faq.map((item, i) => (
                    <Box key={i} py="1" px="2">
                      <Text size="2" weight="medium" as="p">{item.question}</Text>
                      <Text size="1" color="gray" as="p" mt="1">{item.answer}</Text>
                    </Box>
                  ))}
                </Flex>
              </Box>
            )}

            {/* ── Testimonials ── */}
            {data.testimonials.length > 0 && (
              <Box>
                <Flex align="center" gap="2" mb="2">
                  <MessageSquare size={14} className="text-[var(--gray-9)]" />
                  <Text size="2" weight="bold">Reviews</Text>
                </Flex>
                <Flex direction="column" gap="2">
                  {data.testimonials.slice(0, 3).map((t, i) => (
                    <Box key={i} py="2" px="2" className="rounded-[var(--radius-2)] bg-[var(--gray-a2)]">
                      <Text size="1" color="amber" className="tracking-wide">
                        {'★'.repeat(t.rating)}{'☆'.repeat(5 - t.rating)}
                      </Text>
                      <Text size="1" as="p" mt="1" className="italic">&ldquo;{t.text}&rdquo;</Text>
                      <Text size="1" weight="medium" as="p" mt="1">— {t.name}</Text>
                    </Box>
                  ))}
                </Flex>
              </Box>
            )}

            {/* CTA buttons */}
            <Flex direction="column" gap="2" mt="2" pb="4">
              <Button size="3" variant="solid" asChild>
                <Link href={`/${displayFacility.slug}`}>View Full Details</Link>
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
          </Flex>
        </ScrollArea>
      </Box>
    </>
  )
}
