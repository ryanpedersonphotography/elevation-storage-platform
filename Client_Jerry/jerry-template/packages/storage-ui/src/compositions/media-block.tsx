import React from 'react'
import { Flex, Box } from '../primitives'
import { Image } from '../primitives'

export interface MediaBlockProps {
  image: { src: string; alt: string }
  layout?: 'image-right' | 'image-left' | 'stacked'
  children: React.ReactNode
}

export function MediaBlock({
  image,
  layout = 'image-right',
  children,
}: MediaBlockProps) {
  const isStacked = layout === 'stacked'
  const imageElement = (
    <Box style={{ flex: '1 1 0%' }}>
      <Image src={image.src} alt={image.alt} aspect="16/9" />
    </Box>
  )
  const contentElement = (
    <Box style={{ flex: '1 1 0%' }}>
      {children}
    </Box>
  )

  return (
    <Flex
      direction={isStacked ? 'column' : { initial: 'column', md: 'row' }}
      gap="5"
      align="center"
    >
      {layout === 'image-left' ? (
        <>
          {imageElement}
          {contentElement}
        </>
      ) : isStacked ? (
        <>
          {imageElement}
          {contentElement}
        </>
      ) : (
        <>
          {contentElement}
          {imageElement}
        </>
      )}
    </Flex>
  )
}
