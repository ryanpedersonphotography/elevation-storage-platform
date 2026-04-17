import React from 'react'
import type { FacilityConfig } from '@jerry/facility-config/schema'

interface JsonLdProps {
  facility: FacilityConfig
  pageSlug: string
  baseUrl: string
}

function formatHours(facility: FacilityConfig): string[] {
  return facility.info.hours.map((h) => {
    const dayStr = h.days.join(', ')
    return `${dayStr} ${h.open}-${h.close}`
  })
}

function computePriceRange(facility: FacilityConfig): string | undefined {
  const units = facility.data?.units
  if (!units || units.length === 0) return undefined
  const prices = units.map((u) => u.price)
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  return `$${min}/mo - $${max}/mo`
}

function buildJsonLd(facility: FacilityConfig, pageSlug: string, baseUrl: string) {
  const addr = facility.info.address
  const priceRange = computePriceRange(facility)
  return {
    '@context': 'https://schema.org',
    '@type': ['LocalBusiness', 'SelfStorage'],
    name: facility.name,
    url: `${baseUrl}${pageSlug === 'home' ? '' : `/${pageSlug}`}`,
    telephone: facility.info.phone,
    email: facility.info.email,
    address: {
      '@type': 'PostalAddress',
      streetAddress: addr.street,
      addressLocality: addr.city,
      addressRegion: addr.state,
      postalCode: addr.zip,
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: facility.info.coordinates.lat,
      longitude: facility.info.coordinates.lng,
    },
    openingHours: formatHours(facility),
    ...(priceRange ? { priceRange } : {}),
    ...(facility.seo.ogImage ? { image: facility.seo.ogImage } : {}),
  }
}

/**
 * Renders JSON-LD structured data as a proper <script type="application/ld+json"> tag.
 * Must be rendered inside the page component (not via Next.js metadata API).
 */
export function JsonLd({ facility, pageSlug, baseUrl }: JsonLdProps) {
  const jsonLd = buildJsonLd(facility, pageSlug, baseUrl)
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}
