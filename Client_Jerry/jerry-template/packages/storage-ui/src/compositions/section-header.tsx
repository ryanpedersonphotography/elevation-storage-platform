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
  '2': '5',
  '3': '4',
  '4': '3',
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
}: SectionHeaderProps) {
  return (
    <Box mb="4">
      <Heading as={levelToAs[level]} size={levelToSize[level]} align={align}>
        {heading}
      </Heading>
      {description && (
        <Text as="p" size="3" mt="2" color="gray" align={align}>
          {description}
        </Text>
      )}
    </Box>
  )
}
