import { registry } from './registry'
import type { Template } from '../templates/types'
import type { Page, FacilityConfig } from '@jerry/facility-config/schema'

interface PageRendererProps {
  page: Page
  facilityData: FacilityConfig
  template: Template
}

export function PageRenderer({ page, facilityData, template }: PageRendererProps) {
  return (
    <>
      {page.layout.map((sectionKey) => {
        const section = page.sections[sectionKey]
        const Component = registry[section.component]

        if (!Component) {
          throw new Error(
            `Unknown component "${section.component}" in section "${sectionKey}". ` +
            `Available: ${Object.keys(registry).join(', ')}`
          )
        }

        const defaults = template.defaults[section.component]
        return (
          <Component
            key={sectionKey}
            content={section.content}
            layout={section.layout ?? defaults?.layout}
            variant={section.variant ?? defaults?.variant}
            facilityData={facilityData}
          />
        )
      })}
    </>
  )
}
