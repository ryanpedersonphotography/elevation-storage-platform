import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { Inter, Space_Grotesk, DM_Sans } from 'next/font/google'
import { Theme } from '@radix-ui/themes'
import { loadFacility } from '@jerry/facility-config'
import { FacilityProvider, resolveRadixColor, templates } from '@jerry/storage-ui'
import { Nav } from '../components/nav'
import { Footer } from '../components/footer'
import { GtagScript } from '../components/gtag'
import '../styles/globals.css'

const slug = process.env.FACILITY_SLUG
if (!slug) {
  throw new Error(
    'FACILITY_SLUG environment variable is required for standalone builds'
  )
}

const facility = loadFacility(slug)
const template = templates[facility.branding.template]
const accentColor = resolveRadixColor(facility.branding.colors.primary)

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

const fontVar = fontMap[template.font] ?? inter.variable
const gtagId = facility.analytics?.gtag

const domain = facility.deployment.domain ?? 'localhost:3000'

export const metadata: Metadata = {
  metadataBase: new URL(`https://${domain}`),
  title: facility.seo.defaultTitle,
  description: facility.seo.defaultDescription,
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={fontVar}>
      <body>
        <Theme
          accentColor={accentColor}
          grayColor="slate"
          radius={template.radius}
          scaling={template.scaling}
          appearance="light"
        >
          <FacilityProvider facility={facility}>
            <Nav facility={facility} />
            {children}
            <Footer facility={facility} />
          </FacilityProvider>
        </Theme>
        {gtagId && <GtagScript gtagId={gtagId} />}
      </body>
    </html>
  )
}
