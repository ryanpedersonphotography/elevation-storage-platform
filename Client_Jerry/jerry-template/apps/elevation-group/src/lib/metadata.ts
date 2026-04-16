import type { Metadata } from 'next'
import type { FacilityConfig } from '@jerry/facility-config'

const BASE_URL = 'https://elevationgroup.com'

/**
 * Generate Next.js Metadata for a facility page.
 * Page-level SEO fields override facility-level defaults per-field.
 */
export function generateFacilityMetadata(
  facility: FacilityConfig,
  pageSlug: string
): Metadata {
  const page = facility.pages[pageSlug]
  const pageSeo = page?.seo
  const facilitySeo = facility.seo

  const title =
    pageSeo?.title ?? facilitySeo.defaultTitle
  const description =
    pageSeo?.description ?? facilitySeo.defaultDescription
  const keywords = pageSeo?.keywords ?? facilitySeo.keywords ?? []
  const ogImage = pageSeo?.ogImage ?? facilitySeo.ogImage

  const canonicalPath =
    pageSlug === 'home'
      ? `/${facility.slug}`
      : `/${facility.slug}/${pageSlug}`
  const canonical = `${BASE_URL}${canonicalPath}`

  const jsonLd = buildJsonLd(facility, pageSlug)

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: facilitySeo.siteName,
      type: 'website',
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
    },
    other: {
      'script:ld+json': JSON.stringify(jsonLd),
    },
  }
}

function formatHours(facility: FacilityConfig): string[] {
  return facility.info.hours.map((h) => {
    const dayStr = h.days.join(', ')
    return `${dayStr} ${h.open}-${h.close}`
  })
}

function buildJsonLd(facility: FacilityConfig, pageSlug: string) {
  const addr = facility.info.address
  return {
    '@context': 'https://schema.org',
    '@type': ['LocalBusiness', 'SelfStorage'],
    name: facility.name,
    url: `${BASE_URL}/${facility.slug}${pageSlug === 'home' ? '' : `/${pageSlug}`}`,
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
    ...(facility.seo.ogImage
      ? { image: facility.seo.ogImage }
      : {}),
  }
}
