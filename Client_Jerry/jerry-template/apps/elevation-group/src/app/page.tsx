import { loadSubdirectoryFacilities } from '@jerry/facility-config'
import { Container, Heading, Text, Grid, Box, Flex, Separator } from '@radix-ui/themes'
import Link from 'next/link'
import { FacilityFilter } from '../components/facility-filter'
import { ScrollNav } from '../components/scroll-nav'

export default function HomePage() {
  const facilities = loadSubdirectoryFacilities()

  return (
    <>
      <ScrollNav />

      {/* ── Locations (merged: map-bg + full filter grid) ── */}
      <Box className="map-bg" id="locations">
        <Box py="9">
          <div className="max-w-7xl mx-auto px-6">
            <Flex direction="column" align="center" gap="3" mb="8" className="text-center">
              <Heading size="8">Elevation Group Locations</Heading>
              <Text size="4" color="gray" as="p">
                With {facilities.length} locations and counting, find the facility that&apos;s
                right for you — search by city, state, or feature below.
              </Text>
            </Flex>
            <FacilityFilter facilities={facilities} variant="grid" />
          </div>
        </Box>
      </Box>

      {/* ── Footer ── */}
      <Box className="bg-[var(--gray-12)] text-white" py="7" id="contact">
        <Container size="3">
          <Grid columns={{ initial: '1', sm: '2', md: '4' }} gap="6">
            <Flex direction="column" gap="2">
              <Text size="4" weight="bold" className="text-white">Elevation Group</Text>
              <Text size="2" className="text-[var(--gray-8)]">
                Self storage facilities across the nation.
              </Text>
            </Flex>
            <Flex direction="column" gap="2">
              <Text size="2" weight="bold" className="text-white">Locations</Text>
              {facilities.slice(0, 5).map((f) => (
                <Link key={f.slug} href={`/${f.slug}`} className="no-underline">
                  <Text size="2" className="text-[var(--gray-8)]">{f.name}</Text>
                </Link>
              ))}
              {facilities.length > 5 && (
                <Link href="#locations" className="no-underline">
                  <Text size="2" className="text-[var(--gray-8)]">All Locations</Text>
                </Link>
              )}
            </Flex>
            <Flex direction="column" gap="2">
              <Text size="2" weight="bold" className="text-white">What We Offer</Text>
              <Text size="2" className="text-[var(--gray-8)]">Climate Controlled</Text>
              <Text size="2" className="text-[var(--gray-8)]">Drive-Up Access</Text>
              <Text size="2" className="text-[var(--gray-8)]">RV &amp; Boat Storage</Text>
              <Text size="2" className="text-[var(--gray-8)]">24/7 Access</Text>
            </Flex>
            <Flex direction="column" gap="2">
              <Text size="2" weight="bold" className="text-white">Resources</Text>
              <Link href="#locations" className="no-underline">
                <Text size="2" className="text-[var(--gray-8)]">Find a Location</Text>
              </Link>
              <Link href="#contact" className="no-underline">
                <Text size="2" className="text-[var(--gray-8)]">Contact Us</Text>
              </Link>
            </Flex>
          </Grid>
          <Separator my="5" className="bg-[var(--gray-10)]" />
          <Flex justify="between" align="center" wrap="wrap" gap="2">
            <Text size="1" className="text-[var(--gray-9)]">
              &copy; {new Date().getFullYear()} Elevation Group. All rights reserved.
            </Text>
            <Flex gap="4">
              <Text size="1" className="text-[var(--gray-9)]">Privacy Policy</Text>
              <Text size="1" className="text-[var(--gray-9)]">Accessibility</Text>
            </Flex>
          </Flex>
        </Container>
      </Box>
    </>
  )
}
