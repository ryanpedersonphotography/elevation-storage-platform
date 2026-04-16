import React from 'react'
import * as icons from 'lucide-react'
import { Flex, Heading, Text } from '../primitives'

export interface FeatureItemProps {
  icon: string
  heading: string
  description: string
}

export function FeatureItem({ icon, heading, description }: FeatureItemProps) {
  const IconComponent = (icons as unknown as Record<string, React.ComponentType<{ size?: number }>>)[icon]

  return (
    <Flex direction="column" align="center" gap="3" style={{ textAlign: 'center' }}>
      {IconComponent && <IconComponent size={32} />}
      <Heading as="h3" size="4">
        {heading}
      </Heading>
      <Text as="p" size="2" color="gray">
        {description}
      </Text>
    </Flex>
  )
}
