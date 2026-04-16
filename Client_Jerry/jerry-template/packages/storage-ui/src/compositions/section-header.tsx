import React from 'react'
import { Heading, Text, Box } from '../primitives'

export interface SectionHeaderProps {
  heading: string
  description?: string
  level?: '1' | '2' | '3' | '4'
  align?: 'left' | 'center'
}

const levelToSize: Record<string, '8' | '6' | '5' | '4'> = {
  '1': '8',
  '2': '6',
  '3': '5',
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
  align = 'center',
}: SectionHeaderProps) {
  return (
    <Box mb="5" style={{ textAlign: align }}>
      <Heading as={levelToAs[level]} size={levelToSize[level]}>
        {heading}
      </Heading>
      {description && (
        <Text as="p" size="3" mt="2" color="gray">
          {description}
        </Text>
      )}
    </Box>
  )
}
