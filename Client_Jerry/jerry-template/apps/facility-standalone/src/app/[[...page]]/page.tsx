import { loadFacility } from '@jerry/facility-config'
import { PageRenderer, templates } from '@jerry/storage-ui'
import { generateFacilityMetadata } from '../../lib/metadata'

const slug = process.env.FACILITY_SLUG
if (!slug) {
  throw new Error(
    'FACILITY_SLUG environment variable is required for standalone builds'
  )
}

const facility = loadFacility(slug)

export const dynamicParams = false

export async function generateStaticParams() {
  return Object.entries(facility.pages)
    .filter(([, page]) => page.enabled)
    .map(([pageSlug]) => ({
      page: pageSlug === 'home' ? undefined : [pageSlug],
    }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ page?: string[] }>
}) {
  const { page: pageSegments } = await params
  const pageSlug = pageSegments?.[0] ?? 'home'
  return generateFacilityMetadata(facility, pageSlug)
}

export default async function FacilityPage({
  params,
}: {
  params: Promise<{ page?: string[] }>
}) {
  const { page: pageSegments } = await params
  const pageSlug = pageSegments?.[0] ?? 'home'
  const page = facility.pages[pageSlug]

  if (!page || !page.enabled) {
    return null
  }

  const template = templates[facility.branding.template]

  return <PageRenderer page={page} facilityData={facility} template={template} />
}
