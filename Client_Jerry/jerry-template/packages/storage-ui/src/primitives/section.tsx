import React from 'react'
import { Box } from '@radix-ui/themes'
import { Image } from './image'

export interface SectionProps {
  /**
   * Background image for the section. The `alt` field is kept for JSON
   * compatibility with ImageSchema but is intentionally rendered as `alt=""`
   * because the background image is decorative (`aria-hidden="true"`).
   */
  background?: { src: string; alt: string }
  overlay?: 'dark' | 'light'
  children: React.ReactNode
  className?: string
}

export function Section({ background, overlay, children, className }: SectionProps) {
  if (!background) {
    return (
      <Box asChild py="9">
        <section className={className}>
          {children}
        </section>
      </Box>
    )
  }

  return (
    <Box asChild position="relative" style={{ overflow: 'hidden', isolation: 'isolate' }}>
      <section className={className}>
        <Box position="absolute" inset="0">
          <Image
            src={background.src}
            alt=""
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        </Box>
        {overlay && (
          <Box
            data-testid="overlay"
            position="absolute"
            inset="0"
            style={{
              backgroundColor:
                overlay === 'dark'
                  ? 'rgba(0, 0, 0, 0.6)'
                  : 'rgba(255, 255, 255, 0.4)',
            }}
          />
        )}
        <Box position="relative" style={{ zIndex: 1 }} py="9">
          {children}
        </Box>
      </section>
    </Box>
  )
}
