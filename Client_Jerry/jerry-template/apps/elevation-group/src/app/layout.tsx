import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { Inter } from 'next/font/google'
import { Theme } from '@radix-ui/themes'
import '../styles/globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  metadataBase: new URL('https://elevationgroup.com'),
  title: 'Elevation Group | Storage Facilities',
  description:
    'Elevation Group operates self-storage facilities across the region. Find a location near you.',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <Theme>{children}</Theme>
      </body>
    </html>
  )
}
