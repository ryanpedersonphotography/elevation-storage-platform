import { loadSubdirectoryFacilities } from '@jerry/facility-config'
import { Container, Heading, Text, Grid, Box, Flex } from '@radix-ui/themes'
import Link from 'next/link'

export default function HomePage() {
  const facilities = loadSubdirectoryFacilities()

  return (
    <Container size="3" py="9">
      <Flex direction="column" align="center" gap="2" mb="8">
        <Heading size="8" align="center">
          Elevation Group
        </Heading>
        <Text size="4" color="gray" align="center">
          Find a storage facility near you
        </Text>
      </Flex>

      <Grid columns={{ initial: '1', sm: '2', md: '3' }} gap="5">
        {facilities.map((facility) => (
          <Link
            key={facility.slug}
            href={`/${facility.slug}`}
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <Box
              p="5"
              style={{
                border: '1px solid var(--gray-a5)',
                borderRadius: 'var(--radius-3)',
              }}
            >
              <Heading size="4" mb="2">
                {facility.name}
              </Heading>
              <Text size="2" color="gray">
                {facility.info.address.street}, {facility.info.address.city},{' '}
                {facility.info.address.state} {facility.info.address.zip}
              </Text>
              <Text size="2" color="gray" mt="1" as="p">
                {facility.info.phone}
              </Text>
            </Box>
          </Link>
        ))}
      </Grid>
    </Container>
  )
}
