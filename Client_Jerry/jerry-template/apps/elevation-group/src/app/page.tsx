import { loadSubdirectoryFacilities } from '@jerry/facility-config'
import { Container, Heading, Text, Grid, Box, Flex, Badge } from '@radix-ui/themes'
import { FacilityCard } from '@jerry/storage-ui'
import { Shield, Clock, Thermometer, Truck } from 'lucide-react'

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
      <Box py="9" style={{ backgroundColor: 'var(--accent-9)', color: 'white', textAlign: 'center' }}>
        <Container size="2">
          <Heading size="8" style={{ color: 'white' }} mb="3">
            Affordable Self Storage Near You
          </Heading>
          <Text size="4" style={{ color: 'rgba(255,255,255,0.9)' }}>
            Find storage now across {facilities.length} locations
          </Text>
        </Container>
      </Box>

      {/* Facility Grid */}
      <Container size="3" py="8">
        <Flex justify="between" align="center" mb="5">
          <Heading size="6">Our Locations</Heading>
          <Badge size="2" variant="soft">
            {facilities.length} {facilities.length === 1 ? 'Facility' : 'Facilities'}
          </Badge>
        </Flex>
        <Grid columns={{ initial: '1', sm: '2', md: '3' }} gap="5">
          {facilities.map((facility) => (
            <FacilityCard
              key={facility.slug}
              facility={facility}
              href={`/${facility.slug}`}
            />
          ))}
        </Grid>
      </Container>

      {/* What We Offer */}
      <Box py="8" style={{ backgroundColor: 'var(--gray-2)' }}>
        <Container size="3">
          <Heading size="6" align="center" mb="2">What We Offer</Heading>
          <Text size="3" color="gray" align="center" as="p" mb="6">
            Every Elevation Group facility is built for security and convenience
          </Text>
          <Grid columns={{ initial: '1', sm: '2', md: '4' }} gap="5">
            {features.map((f) => (
              <Flex key={f.heading} direction="column" align="center" gap="3" style={{ textAlign: 'center' }}>
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
          <Box style={{ textAlign: 'center', padding: '2rem 0' }}>
            <Text as="p" size="5" style={{ fontStyle: 'italic', lineHeight: 1.6 }}>
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
      <Box py="7" style={{ background: 'linear-gradient(135deg, var(--accent-9), var(--accent-11))', color: 'white', textAlign: 'center' }}>
        <Container size="2">
          <Heading size="6" style={{ color: 'white' }} mb="2">
            Ready to Reserve Your Unit?
          </Heading>
          <Text size="3" style={{ color: 'rgba(255,255,255,0.9)' }} as="p" mb="4">
            Browse our locations and find the perfect space for your needs.
          </Text>
        </Container>
      </Box>
    </>
  )
}
