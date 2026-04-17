import type { ReactNode } from 'react'
import { Inter, Space_Grotesk, DM_Sans } from 'next/font/google'
import { Theme, Flex, Box, Text, Heading, Button, Badge, Card, Separator } from '@radix-ui/themes'
import Link from 'next/link'
import { ChevronLeft, MapPin, Phone, Clock, ExternalLink, Star } from 'lucide-react'
import { loadFacility, loadSubdirectoryFacilities } from '@jerry/facility-config'
import { FacilityProvider, resolveRadixColor, templates } from '@jerry/storage-ui'
import { Nav } from '../../components/nav'
import { Footer } from '../../components/footer'
import { GtagScript } from '../../components/gtag'

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

  const { info, data } = facility
  const addr = info.address
  const reviewCount = data.testimonials.length
  const avgRating =
    reviewCount > 0
      ? Math.round((data.testimonials.reduce((s, t) => s + t.rating, 0) / reviewCount) * 10) / 10
      : 0

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

          {/* Single-column facility layout */}
          <Box className="bg-[var(--gray-a2)] min-h-screen">
            <Box className="max-w-5xl mx-auto px-6 pt-4 pb-8">
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

              {/* Facility header card */}
              <Card size="3" mb="6">
                <Flex direction={{ initial: 'column', md: 'row' }} gap="5">
                  {/* Left: facility image */}
                  {info.image && (
                    <Box className="shrink-0 md:w-[400px]">
                      <img
                        src={info.image.src}
                        alt={info.image.alt}
                        className="w-full aspect-[16/9] object-cover rounded-[var(--radius-3)]"
                      />
                    </Box>
                  )}

                  {/* Right: facility info */}
                  <Flex direction="column" gap="3" flexGrow="1">
                    <Heading as="h1" size="6">{facility.name}</Heading>

                    {/* Star rating + review count */}
                    {reviewCount > 0 && (
                      <Flex align="center" gap="2">
                        <Flex align="center" gap="1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              size={16}
                              className={
                                i < Math.round(avgRating)
                                  ? 'fill-[var(--amber-9)] text-[var(--amber-9)]'
                                  : 'text-[var(--gray-6)]'
                              }
                            />
                          ))}
                        </Flex>
                        <Text size="2" weight="medium">{avgRating}</Text>
                        <Text size="2" color="gray">
                          ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
                        </Text>
                      </Flex>
                    )}

                    {/* Address */}
                    <Flex align="start" gap="2">
                      <MapPin size={15} className="text-[var(--gray-9)] shrink-0 mt-0.5" />
                      <Text size="2">
                        {addr.street}, {addr.city}, {addr.state} {addr.zip}
                      </Text>
                    </Flex>

                    {/* Phone */}
                    <Flex asChild align="center" gap="2">
                      <a href={`tel:${info.phone}`} className="no-underline text-inherit">
                        <Phone size={15} className="text-[var(--gray-9)] shrink-0" />
                        <Text size="2" weight="medium">{info.phone}</Text>
                      </a>
                    </Flex>

                    {/* Hours — compact inline */}
                    <Flex align="center" gap="2" wrap="wrap">
                      <Clock size={15} className="text-[var(--gray-9)] shrink-0" />
                      {info.hours.map((h, i) => (
                        <Badge key={i} variant="surface" size="1">
                          {h.days.join(', ')}: {h.open} – {h.close}
                        </Badge>
                      ))}
                    </Flex>

                    {/* Action buttons */}
                    <Flex gap="3" mt="1">
                      <Button size="3" variant="solid" asChild>
                        <Link href={`/${facility.slug}/reserve`}>Reserve a Unit</Link>
                      </Button>
                      {info.directionsUrl && (
                        <Button size="3" variant="outline" asChild>
                          <a href={info.directionsUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink size={14} />
                            Get Directions
                          </a>
                        </Button>
                      )}
                    </Flex>
                  </Flex>
                </Flex>
              </Card>

              {/* Page content — single column */}
              <Box className="facility-content">
                {children}
              </Box>
            </Box>
          </Box>

          <Footer facility={facility} />
        </FacilityProvider>
      </Theme>
      {gtagId && <GtagScript gtagId={gtagId} />}
    </div>
  )
}
