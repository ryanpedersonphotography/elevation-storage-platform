'use client'
import React, { useCallback } from 'react'
import { Flex, Button } from '../primitives'
import { useAnalytics } from '../hooks/use-analytics'

interface CTAConfig {
  label: string
  href: string
  variant: string
}

export interface CTAGroupProps {
  primary: CTAConfig
  secondary?: CTAConfig
}

const variantMap: Record<string, 'solid' | 'soft' | 'outline' | 'ghost'> = {
  primary: 'solid',
  secondary: 'soft',
  outline: 'outline',
  ghost: 'ghost',
}

function resolveVariant(variant: string): 'solid' | 'soft' | 'outline' | 'ghost' {
  return variantMap[variant] ?? 'solid'
}

/** Detect analytics event from CTA href */
function detectEvent(href: string): string | null {
  if (/reserve/i.test(href)) return 'reserve_click'
  if (href.startsWith('tel:')) return 'phone_click'
  if (/directions/i.test(href)) return 'directions_click'
  return null
}

export function CTAGroup({ primary, secondary }: CTAGroupProps) {
  const { track } = useAnalytics()

  const handleClick = useCallback(
    (href: string) => {
      const event = detectEvent(href)
      if (event) track(event)
    },
    [track]
  )

  return (
    <Flex gap="3" justify="center" wrap="wrap">
      <Button
        variant={resolveVariant(primary.variant)}
        size="3"
        asChild
        onClick={() => handleClick(primary.href)}
      >
        <a href={primary.href}>{primary.label}</a>
      </Button>
      {secondary && (
        <Button
          variant={resolveVariant(secondary.variant)}
          size="3"
          asChild
          onClick={() => handleClick(secondary.href)}
        >
          <a href={secondary.href}>{secondary.label}</a>
        </Button>
      )}
    </Flex>
  )
}
