import React from 'react'
import { Heading, Text, Box } from '../primitives'

export interface SectionHeaderProps {
  heading: string
  description?: string
  level?: '1' | '2' | '3' | '4'
  align?: 'left' | 'center'
  /** When true, renders white text suitable for dark overlays / backgrounds. */
  invertColor?: boolean
}

const levelToSize: Record<string, '8' | '6' | '5' | '4'> = {
  '1': '8',
  '2': '5',
  '3': '4',
  '4': '4',
}

const levelToAs: Record<string, 'h1' | 'h2' | 'h3' | 'h4'> = {
  '1': 'h1',
  '2': 'h2',
  '3': 'h3',
  '4': 'h4',
}

export function SectionHeader({
  heading,
  description,
  level = '2',
  align = 'left',
  invertColor = false,
}: SectionHeaderProps) {
  return (
    <Box mb="4">
      <Heading
        as={levelToAs[level]}
        size={levelToSize[level]}
        align={align}
        weight="bold"
        {...(invertColor ? { style: { color: 'white' } } : {})}
      >
        {heading}
      </Heading>
      {description && (
        <Text
          as="p"
          size="3"
          mt="2"
          align={align}
          {...(invertColor
            ? { style: { color: 'rgba(255,255,255,0.95)' } }
            : { color: 'gray' as const })}
        >
          {description}
        </Text>
      )}
    </Box>
  )
}
