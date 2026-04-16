import type { Metadata } from 'next'
import type { FacilityConfig } from '@jerry/facility-config'

const BASE_URL = 'https://elevationgroup.com'

/**
 * Generate Next.js Metadata for a facility page.
 * Page-level SEO fields override facility-level defaults per-field.
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

/** Base URL for the umbrella site, used by JsonLd component */
export function getFacilityBaseUrl(facility: FacilityConfig): string {
  return `${BASE_URL}/${facility.slug}`
}
