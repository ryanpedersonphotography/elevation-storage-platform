import Link from 'next/link'
import { Container, Flex, Grid, Text, Box, Separator } from '@radix-ui/themes'
import type { FacilityConfig } from '@jerry/facility-config'

interface FooterProps {
  facility: FacilityConfig
}

function formatHoursLine(hours: FacilityConfig['info']['hours'][number]): string {
  const days = hours.days.join(', ')
  return `${days}: ${hours.open} - ${hours.close}`
}

export function Footer({ facility }: FooterProps) {
  const { info } = facility
  const addr = info.address
  const enabledPages = Object.entries(facility.pages).filter(([, page]) => page.enabled)

  return (
    <Box asChild style={{ backgroundColor: 'var(--gray-12)', color: 'white' }}>
      <footer>
        <Container size="3" py="7">
          <Grid columns={{ initial: '1', sm: '2', md: '4' }} gap="6">
            <Flex direction="column" gap="2">
              <Text size="4" weight="bold" style={{ color: 'white' }}>
                {facility.name}
              </Text>
              <Text size="2" style={{ color: 'var(--gray-8)' }}>
                {addr.street}
              </Text>
              <Text size="2" style={{ color: 'var(--gray-8)' }}>
                {addr.city}, {addr.state} {addr.zip}
              </Text>
            </Flex>

            <Flex direction="column" gap="2">
              <Text size="2" weight="bold" style={{ color: 'white' }}>Quick Links</Text>
              {enabledPages.map(([slug]) => {
                const href = slug === 'home' ? '/' : `/${slug}`
                const label = slug.charAt(0).toUpperCase() + slug.slice(1)
                return (
                  <Link key={slug} href={href} style={{ textDecoration: 'none' }}>
                    <Text size="2" style={{ color: 'var(--gray-8)' }}>{label}</Text>
                  </Link>
                )
              })}
            </Flex>

            <Flex direction="column" gap="2">
              <Text size="2" weight="bold" style={{ color: 'white' }}>Storage Features</Text>
              {facility.data.amenities.slice(0, 5).map((a) => (
                <Text key={a.id} size="2" style={{ color: 'var(--gray-8)' }}>{a.label}</Text>
              ))}
            </Flex>

            <Flex direction="column" gap="2">
              <Text size="2" weight="bold" style={{ color: 'white' }}>Contact</Text>
              <a href={`tel:${info.phone}`} style={{ textDecoration: 'none' }}>
                <Text size="2" style={{ color: 'var(--gray-8)' }}>{info.phone}</Text>
              </a>
              <a href={`mailto:${info.email}`} style={{ textDecoration: 'none' }}>
                <Text size="2" style={{ color: 'var(--gray-8)' }}>{info.email}</Text>
              </a>
              <Box mt="2">
                <Text size="2" weight="bold" style={{ color: 'white' }}>Hours</Text>
                {info.hours.map((h, i) => (
                  <Text key={i} size="1" style={{ color: 'var(--gray-8)' }} as="p">
                    {formatHoursLine(h)}
                  </Text>
                ))}
              </Box>
            </Flex>
          </Grid>

          <Separator my="5" style={{ backgroundColor: 'var(--gray-10)' }} />

          <Flex justify="between" align="center" wrap="wrap" gap="2">
            <Text size="1" style={{ color: 'var(--gray-9)' }}>
              &copy; {new Date().getFullYear()} {facility.name}. All rights reserved.
            </Text>
            <Flex gap="4">
              <Text size="1" style={{ color: 'var(--gray-9)' }}>Privacy Policy</Text>
              <Text size="1" style={{ color: 'var(--gray-9)' }}>Accessibility</Text>
            </Flex>
          </Flex>
        </Container>
      </footer>
    </Box>
  )
}
