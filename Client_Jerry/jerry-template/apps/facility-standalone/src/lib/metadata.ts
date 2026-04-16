import type { Metadata } from 'next'
import type { FacilityConfig } from '@jerry/facility-config'

/**
 * Generate Next.js Metadata for a facility page.
 * Standalone mode: canonical URLs use deployment.domain (no slug prefix).
 *
 * Note: JSON-LD is rendered via the <JsonLd> component in the page,
 * not via the metadata API (which doesn't produce a proper script tag).
 */
export function generateFacilityMetadata(
  facility: FacilityConfig,
  pageSlug: string
): Metadata {
  const page = facility.pages[pageSlug]
  const pageSeo = page?.seo
  const facilitySeo = facility.seo

  const title = pageSeo?.title ?? facilitySeo.defaultTitle
  const description = pageSeo?.description ?? facilitySeo.defaultDescription
  const keywords = pageSeo?.keywords ?? facilitySeo.keywords ?? []
  const ogImage = pageSeo?.ogImage ?? facilitySeo.ogImage

  const baseUrl = getFacilityBaseUrl(facility)
  const canonicalPath = pageSlug === 'home' ? '' : `/${pageSlug}`
  const canonical = `${baseUrl}${canonicalPath}`

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
  }
}

/** Base URL for standalone facility, used by JsonLd component */
export function getFacilityBaseUrl(facility: FacilityConfig): string {
  const domain = facility.deployment.domain ?? 'localhost:3000'
  return `https://${domain}`
}
