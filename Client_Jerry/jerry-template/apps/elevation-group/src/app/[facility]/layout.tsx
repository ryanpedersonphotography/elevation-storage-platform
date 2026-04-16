import type { ReactNode } from 'react'
import { Inter, Montserrat, Poppins } from 'next/font/google'
import { Theme } from '@radix-ui/themes'
import { loadFacility, loadSubdirectoryFacilities } from '@jerry/facility-config'
import { FacilityProvider, resolveRadixColor, templates } from '@jerry/storage-ui'
import { Nav } from '../../components/nav'
import { Footer } from '../../components/footer'
import { GtagScript } from '../../components/gtag'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const montserrat = Montserrat({ subsets: ['latin'], variable: '--font-montserrat' })
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
})

const fontMap: Record<string, string> = {
  Inter: inter.variable,
  Montserrat: montserrat.variable,
  Poppins: poppins.variable,
}

export const dynamicParams = false

export async function generateStaticParams() {
  const facilities = loadSubdirectoryFacilities()
  return facilities.map((f) => ({ facility: f.slug }))
}

export default async function FacilityLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ facility: string }>
}) {
  const { facility: facilitySlug } = await params
  const facility = loadFacility(facilitySlug)
  const template = templates[facility.branding.template]
  const accentColor = resolveRadixColor(facility.branding.colors.primary)
  const fontVar = fontMap[template.font] ?? inter.variable
  const gtagId = facility.analytics?.gtag

  return (
    <div className={fontVar}>
      <Theme
        accentColor={accentColor}
        radius={template.radius}
        scaling={template.scaling}
      >
        <FacilityProvider facility={facility}>
          <Nav facility={facility} />
          {children}
          <Footer facility={facility} />
        </FacilityProvider>
      </Theme>
      {gtagId && <GtagScript gtagId={gtagId} />}
    </div>
  )
}
