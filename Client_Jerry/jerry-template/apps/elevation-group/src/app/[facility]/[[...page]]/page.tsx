import { loadFacility, loadSubdirectoryFacilities } from '@jerry/facility-config'
import { PageRenderer, templates } from '@jerry/storage-ui'
import { generateFacilityMetadata } from '../../../lib/metadata'

export const dynamicParams = false

export async function generateStaticParams() {
  const facilities = loadSubdirectoryFacilities()
  return facilities.flatMap((f) =>
    Object.entries(f.pages)
      .filter(([, page]) => page.enabled)
      .map(([pageSlug]) => ({
        facility: f.slug,
        page: pageSlug === 'home' ? undefined : [pageSlug],
      }))
  )
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ facility: string; page?: string[] }>
}) {
  const { facility: facilitySlug, page: pageSegments } = await params
  const facility = loadFacility(facilitySlug)
  const pageSlug = pageSegments?.[0] ?? 'home'
  return generateFacilityMetadata(facility, pageSlug)
}

export default async function FacilityPage({
  params,
}: {
  params: Promise<{ facility: string; page?: string[] }>
}) {
  const { facility: facilitySlug, page: pageSegments } = await params
  const facility = loadFacility(facilitySlug)
  const pageSlug = pageSegments?.[0] ?? 'home'
  const page = facility.pages[pageSlug]

  if (!page || !page.enabled) {
    return null
  }

  const template = templates[facility.branding.template]

  return <PageRenderer page={page} facilityData={facility} template={template} />
}
