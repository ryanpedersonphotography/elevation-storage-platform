import React from 'react'
import { Flex, Button } from '../primitives'

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

export function CTAGroup({ primary, secondary }: CTAGroupProps) {
  return (
    <Flex gap="3" justify="center" wrap="wrap">
      <Button variant={resolveVariant(primary.variant)} size="3" asChild>
        <a href={primary.href}>{primary.label}</a>
      </Button>
      {secondary && (
        <Button variant={resolveVariant(secondary.variant)} size="3" asChild>
          <a href={secondary.href}>{secondary.label}</a>
        </Button>
      )}
    </Flex>
  )
}
