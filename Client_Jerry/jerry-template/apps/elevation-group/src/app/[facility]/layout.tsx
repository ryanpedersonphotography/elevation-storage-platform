import type { ReactNode } from 'react'
import { Inter, Space_Grotesk, DM_Sans } from 'next/font/google'
import { Theme, Container, Flex, Box } from '@radix-ui/themes'
import { loadFacility, loadSubdirectoryFacilities } from '@jerry/facility-config'
import { FacilityProvider, resolveRadixColor, templates } from '@jerry/storage-ui'
import { Nav } from '../../components/nav'
import { Footer } from '../../components/footer'
import { GtagScript } from '../../components/gtag'
import { FacilitySidebar } from '../../components/facility-sidebar'
import { FacilityTabs } from '../../components/facility-tabs'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-space-grotesk' })
const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-dm-sans',
})

const fontMap: Record<string, string> = {
  Inter: inter.variable,
  'Space Grotesk': spaceGrotesk.variable,
  'DM Sans': dmSans.variable,
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
        grayColor="slate"
        radius={template.radius}
        scaling={template.scaling}
        appearance="light"
      >
        <FacilityProvider facility={facility}>
          <Nav facility={facility} />
          <Container size="3" py="6">
            <Flex direction={{ initial: 'column', md: 'row' }} gap="6">
              {/* Sidebar */}
              <Box className="md:w-80 shrink-0">
                <FacilitySidebar facility={facility} />
              </Box>
              {/* Main content with tabs */}
              <Box flexGrow="1" className="min-w-0">
                <FacilityTabs facility={facility} />
                {children}
              </Box>
            </Flex>
          </Container>
          <Footer facility={facility} />
        </FacilityProvider>
      </Theme>
      {gtagId && <GtagScript gtagId={gtagId} />}
    </div>
  )
}
