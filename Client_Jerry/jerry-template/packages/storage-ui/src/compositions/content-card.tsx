import React from 'react'
import { Card, Heading, Text, Box } from '../primitives'
import { Image } from '../primitives'

export interface ContentCardProps {
  image?: { src: string; alt: string }
  title?: string
  description?: string
  children?: React.ReactNode
}

export function ContentCard({ image, title, description, children }: ContentCardProps) {
  return (
    <Card>
      {image && <Image src={image.src} alt={image.alt} aspect="16/9" />}
      <Box p="3">
        {title && (
          <Heading as="h3" size="4" mb="2">
            {title}
          </Heading>
        )}
        {description && (
          <Text as="p" size="2" color="gray">
            {description}
          </Text>
        )}
        {children}
      </Box>
    </Card>
  )
}
