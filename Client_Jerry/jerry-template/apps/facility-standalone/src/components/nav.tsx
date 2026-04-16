import Link from 'next/link'
import { Flex, Text, Button } from '@radix-ui/themes'
import type { FacilityConfig } from '@jerry/facility-config'

interface NavProps {
  facility: FacilityConfig
}

export function Nav({ facility }: NavProps) {
  const enabledPages = Object.entries(facility.pages).filter(
    ([, page]) => page.enabled
  )

  return (
    <Flex
      asChild
      justify="between"
      align="center"
      px="5"
      py="3"
      style={{
        borderBottom: '1px solid var(--gray-a5)',
      }}
    >
      <nav>
        <Flex align="center" gap="3">
          <Link
            href="/"
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <Text size="4" weight="bold">
              {facility.name}
            </Text>
          </Link>
        </Flex>

        <Flex gap="3" align="center">
          {enabledPages.map(([slug]) => {
            const href = slug === 'home' ? '/' : `/${slug}`
            const label = slug.charAt(0).toUpperCase() + slug.slice(1)
            return (
              <Button key={slug} asChild variant="ghost" size="2">
                <Link href={href}>{label}</Link>
              </Button>
            )
          })}
        </Flex>
      </nav>
    </Flex>
  )
}
