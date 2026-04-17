'use client'
import { useState, useEffect } from 'react'
import { Container, Box, Flex, Text, Button } from '@radix-ui/themes'
import Link from 'next/link'

export function ScrollNav() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 100)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <Box
      className={`fixed top-0 left-0 right-0 z-50 bg-[var(--gray-12)] transition-transform duration-300 sm:hidden ${
        visible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      <Container size="3">
        <Flex justify="between" align="center" py="3">
          <Link href="/" className="no-underline">
            <Text size="5" weight="bold" className="text-white">
              Elevation Group
            </Text>
          </Link>
          <Button size="2" variant="outline" highContrast asChild className="!border-white !text-white">
            <Link href="#locations">Find Storage</Link>
          </Button>
        </Flex>
      </Container>
    </Box>
  )
}
