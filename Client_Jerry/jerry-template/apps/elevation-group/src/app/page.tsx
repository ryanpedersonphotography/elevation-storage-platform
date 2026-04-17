import { loadSubdirectoryFacilities } from '@jerry/facility-config'
import { Container, Heading, Text, Grid, Box, Flex } from '@radix-ui/themes'
import { Shield, Clock, Thermometer, Truck } from 'lucide-react'
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

  const features = [
    { icon: Shield, heading: 'Secure Facilities', blurb: 'Gated access, HD cameras, and personal entry codes at every location.' },
    { icon: Clock, heading: '24/7 Access', blurb: 'Come and go on your schedule with round-the-clock gate access.' },
    { icon: Thermometer, heading: 'Climate Controlled', blurb: 'Temperature and humidity regulated units to protect your belongings.' },
    { icon: Truck, heading: 'Drive-Up Access', blurb: 'Pull right up to your unit for easy loading and unloading.' },
  ]

  return (
    <>
      {/* Hero */}
      <Box py="9" className="bg-[var(--accent-9)] text-white text-center">
        <Container size="2">
          <Heading size="8" className="text-white" mb="3">
            Affordable Self Storage Near You
          </Heading>
          <Text size="4" className="text-white/90">
            Find storage now across {facilities.length} locations
          </Text>
        </Container>
      </Box>

      {/* Filterable Facility Grid */}
      <Container size="3" py="8">
        <Heading size="6" mb="4">Our Locations</Heading>
        <FacilityFilter facilities={facilities} />
      </Container>

      {/* What We Offer */}
      <Box py="8" className="bg-[var(--gray-2)]">
        <Container size="3">
          <Heading size="6" align="center" mb="2">What We Offer</Heading>
          <Text size="3" color="gray" align="center" as="p" mb="6">
            Every Elevation Group facility is built for security and convenience
          </Text>
          <Grid columns={{ initial: '1', sm: '2', md: '4' }} gap="5">
            {features.map((f) => (
              <Flex key={f.heading} direction="column" align="center" gap="3" className="text-center">
                <f.icon size={32} />
                <Heading as="h3" size="4">{f.heading}</Heading>
                <Text size="2" color="gray">{f.blurb}</Text>
              </Flex>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Testimonial */}
      {bestReview && (
        <Container size="2" py="8">
          <Heading size="6" align="center" mb="2">What Our Customers Are Saying</Heading>
          {totalReviews > 0 && (
            <Text size="2" color="gray" align="center" as="p" mb="5">
              {totalReviews} reviews across all locations
            </Text>
          )}
          <Box py="5" className="text-center">
            <Text as="p" size="5" className="italic leading-relaxed">
              &ldquo;{bestReview.text}&rdquo;
            </Text>
            <Text as="p" size="3" mt="4" weight="bold">{bestReview.name}</Text>
            <Text as="p" size="2" color="gray" mt="1">
              {'★'.repeat(bestReview.rating)}{'☆'.repeat(5 - bestReview.rating)}
            </Text>
          </Box>
        </Container>
      )}

      {/* CTA */}
      <Box py="7" className="bg-gradient-to-br from-[var(--accent-9)] to-[var(--accent-11)] text-white text-center">
        <Container size="2">
          <Heading size="6" className="text-white" mb="2">
            Ready to Reserve Your Unit?
          </Heading>
          <Text size="3" className="text-white/90" as="p" mb="4">
            Browse our locations and find the perfect space for your needs.
          </Text>
        </Container>
      </Box>
    </>
  )
}
