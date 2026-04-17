import type { ReactNode } from 'react'
import { Inter, Space_Grotesk, DM_Sans } from 'next/font/google'
import { Theme, Flex, Box, Text } from '@radix-ui/themes'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
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

          {/* Two-column facility layout — wide container */}
          <Box className="bg-[var(--gray-a2)] min-h-screen">
            <Box className="max-w-7xl mx-auto px-6 pt-4 pb-8">
              {/* Breadcrumb */}
              <Flex align="center" gap="1" mb="4">
                <ChevronLeft size={14} className="text-[var(--gray-9)]" />
                <Link href="/#locations" className="no-underline">
                  <Text size="2" color="gray" className="hover:text-[var(--gray-12)] transition-colors">
                    All Locations
                  </Text>
                </Link>
                <Text size="2" color="gray" className="mx-1">/</Text>
                <Text size="2" weight="medium">{facility.name}</Text>
              </Flex>
              <Flex direction={{ initial: 'column', lg: 'row' }} gap="8">
                {/* Sticky sidebar */}
                <Box className="lg:w-[380px] shrink-0">
                  <Box className="lg:sticky lg:top-20">
                    <FacilitySidebar facility={facility} />
                  </Box>
                </Box>

                {/* Main content */}
                <Box flexGrow="1" className="min-w-0">
                  <FacilityTabs facility={facility} />
                  <Box className="facility-content">
                    {children}
                  </Box>
                </Box>
              </Flex>
            </Box>
          </Box>

          <Footer facility={facility} />
        </FacilityProvider>
      </Theme>
      {gtagId && <GtagScript gtagId={gtagId} />}
    </div>
  )
}
