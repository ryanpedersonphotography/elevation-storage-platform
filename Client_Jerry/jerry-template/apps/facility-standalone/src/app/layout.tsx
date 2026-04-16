import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { Inter, Montserrat, Poppins } from 'next/font/google'
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
      </body>
    </html>
  )
}
