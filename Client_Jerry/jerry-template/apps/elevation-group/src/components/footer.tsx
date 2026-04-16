import { Container, Flex, Text } from '@radix-ui/themes'
import type { FacilityConfig } from '@jerry/facility-config'

interface FooterProps {
  facility: FacilityConfig
}

function formatHoursLine(hours: FacilityConfig['info']['hours'][number]): string {
  const days = hours.days.join(', ')
  return `${days}: ${hours.open} - ${hours.close}`
}

export function Footer({ facility }: FooterProps) {
  const { info, branding } = facility
  const addr = info.address

  return (
    <Container size="3" py="6" asChild>
      <footer>
        <Flex
          direction={{ initial: 'column', sm: 'row' }}
          justify="between"
          gap="5"
          style={{ borderTop: '1px solid var(--gray-a5)', paddingTop: 'var(--space-5)' }}
        >
          <Flex direction="column" gap="1">
            <Text size="3" weight="bold">
              {facility.name}
            </Text>
            <Text size="2" color="gray">
              {addr.street}, {addr.city}, {addr.state} {addr.zip}
            </Text>
            <Text size="2" color="gray">
              {info.phone}
            </Text>
          </Flex>

          <Flex direction="column" gap="1">
            <Text size="2" weight="bold">
              Hours
            </Text>
            {info.hours.map((h, i) => (
              <Text key={i} size="2" color="gray">
                {formatHoursLine(h)}
              </Text>
            ))}
          </Flex>

          {branding.showParent && (
            <Flex direction="column" gap="1" align="end">
              <Text size="1" color="gray">
                Part of the Elevation Group family
              </Text>
            </Flex>
          )}
        </Flex>
      </footer>
    </Container>
  )
}
