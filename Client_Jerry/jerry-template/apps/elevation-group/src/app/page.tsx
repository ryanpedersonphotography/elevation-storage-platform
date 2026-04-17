import { loadSubdirectoryFacilities } from '@jerry/facility-config'
import { Container, Heading, Text, Grid, Box, Flex, Card, Button, Separator } from '@radix-ui/themes'
import { Shield, Clock, Thermometer, Truck, MapPin, Ruler, BookOpen } from 'lucide-react'
import Link from 'next/link'
import { FacilityFilter } from '../components/facility-filter'

export default function HomePage() {
  const facilities = loadSubdirectoryFacilities()

  const totalReviews = facilities.reduce(
    (sum, f) => sum + f.data.testimonials.length,
    0
  )
  const bestReview = facilities
    .flatMap((f) => f.data.testimonials)
    .sort((a, b) => b.rating - a.rating)[0]

  return (
    <>
      {/* ── Top Nav ── */}
      <Box className="bg-[var(--gray-12)]">
        <Container size="3">
          <Flex justify="between" align="center" py="3">
            <Link href="/" className="no-underline">
              <Text size="5" weight="bold" className="text-white">
                Elevation Group
              </Text>
            </Link>
            <Flex gap="4" align="center" display={{ initial: 'none', md: 'flex' }}>
              <Link href="#locations" className="no-underline">
                <Text size="2" className="text-[var(--gray-6)] hover:text-white">Locations</Text>
              </Link>
              <Link href="#features" className="no-underline">
                <Text size="2" className="text-[var(--gray-6)] hover:text-white">Storage Features</Text>
              </Link>
              <Link href="#faq" className="no-underline">
                <Text size="2" className="text-[var(--gray-6)] hover:text-white">Size Guide</Text>
              </Link>
              <Link href="#contact" className="no-underline">
                <Text size="2" className="text-[var(--gray-6)] hover:text-white">Contact Us</Text>
              </Link>
            </Flex>
            <Button size="2" variant="solid" color="red" asChild>
              <Link href="#locations">Pay Now</Link>
            </Button>
          </Flex>
        </Container>
      </Box>

      {/* ── Hero with background image + search card overlay ── */}
      <Box position="relative" className="overflow-hidden">
        <img
          src="https://picsum.photos/seed/elevation-hero/1600/600"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <Box className="absolute inset-0 bg-black/30" />
        <Box position="relative" py="9">
          <Container size="2">
            <Card size="4" className="mx-auto max-w-xl">
              <Flex direction="column" align="center" gap="3" p="5">
                <Heading size="7" align="center">
                  Affordable Self Storage near You
                </Heading>
                <Text size="3" color="gray" align="center">
                  Find storage now and take advantage of special rates.
                </Text>
                <Box mt="3" className="w-full">
                  <Text as="label" size="1" color="gray" mb="1" className="block">
                    Zip or City, State
                  </Text>
                  <FacilityFilter facilities={facilities} variant="search" />
                </Box>
              </Flex>
            </Card>
          </Container>
        </Box>
      </Box>

      {/* ── Quick Links Strip ── */}
      <Box className="bg-[var(--gray-2)] border-b border-[var(--gray-a4)]">
        <Container size="3" py="5">
          <Grid columns="3" gap="5">
            <Link href="#locations" className="no-underline text-inherit">
              <Flex direction="column" align="center" gap="2">
                <MapPin size={28} />
                <Text size="3" weight="bold">Locations</Text>
              </Flex>
            </Link>
            <Link href="#features" className="no-underline text-inherit">
              <Flex direction="column" align="center" gap="2">
                <Ruler size={28} />
                <Text size="3" weight="bold">Size Guide</Text>
              </Flex>
            </Link>
            <Link href="#contact" className="no-underline text-inherit">
              <Flex direction="column" align="center" gap="2">
                <BookOpen size={28} />
                <Text size="3" weight="bold">Blog</Text>
              </Flex>
            </Link>
          </Grid>
        </Container>
      </Box>

      {/* ── What We Offer (split layout) ── */}
      <Box id="features" className="bg-[var(--gray-2)]">
        <Container size="3" py="8">
          <Flex direction={{ initial: 'column', md: 'row' }} gap="7">
            {/* Left column — text */}
            <Flex direction="column" gap="3" className="md:max-w-xs" justify="center">
              <Heading size="6">What We Offer</Heading>
              <Text size="3" color="gray" as="p">
                Every storage feature is designed from scratch against standards forged from
                years of experience in the self storage industry. The result is a high quality
                consistent customer experience you can count on.
              </Text>
              <Box>
                <Button size="3" variant="solid" color="red" asChild>
                  <Link href="#features">View All Features</Link>
                </Button>
              </Box>
            </Flex>
            {/* Right column — 2x2 feature grid */}
            <Box flexGrow="1">
              <Grid columns="2" gap="0">
                {[
                  { icon: Truck, label: 'Hand Carts and Dollies' },
                  { icon: Clock, label: 'No Long Term Contracts' },
                  { icon: Shield, label: 'Drive-Up Access' },
                  { icon: Thermometer, label: 'Climate-Controlled Units' },
                ].map((f) => (
                  <Flex
                    key={f.label}
                    direction="column"
                    align="center"
                    justify="center"
                    gap="3"
                    p="6"
                    className="border border-[var(--gray-a4)]"
                  >
                    <f.icon size={32} className="text-[var(--accent-9)]" />
                    <Text size="3" weight="bold" align="center">{f.label}</Text>
                  </Flex>
                ))}
              </Grid>
            </Box>
          </Flex>
        </Container>
      </Box>

      <Separator size="4" />

      {/* ── Our Guarantee ── */}
      <Container size="2" py="8">
        <Flex direction="column" align="center" gap="3" className="text-center">
          <Heading size="6">Our Guarantee</Heading>
          <Text size="3" color="gray" as="p">
            We stand behind every facility in the Elevation Group network. If you&apos;re not
            satisfied within 30 days, we&apos;ll help you find a better fit — no questions asked.
          </Text>
        </Flex>
      </Container>

      <Separator size="4" />

      {/* ── Testimonial ── */}
      {bestReview && (
        <Container size="2" py="8">
          <Flex direction="column" align="center" gap="3" className="text-center">
            <Heading size="6">What Our Customers Are Saying</Heading>
            {totalReviews > 0 && (
              <Text size="2" color="gray" as="p">
                {totalReviews} reviews across all locations
              </Text>
            )}
            <Box py="3">
              <Text as="p" size="5" className="italic leading-relaxed">
                &ldquo;{bestReview.text}&rdquo;
              </Text>
              <Text as="p" size="3" mt="4" weight="bold">{bestReview.name}</Text>
              <Text as="p" size="2" color="gray" mt="1">
                {'★'.repeat(bestReview.rating)}{'☆'.repeat(5 - bestReview.rating)}
              </Text>
            </Box>
          </Flex>
        </Container>
      )}

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
              <Text size="2" className="text-[var(--gray-8)]">Size Guide</Text>
              <Text size="2" className="text-[var(--gray-8)]">FAQs</Text>
              <Text size="2" className="text-[var(--gray-8)]">Storage Tips</Text>
              <Text size="2" className="text-[var(--gray-8)]">Contact Us</Text>
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
