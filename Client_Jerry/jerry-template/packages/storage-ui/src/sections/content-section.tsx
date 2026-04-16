import React from 'react'
import { z } from 'zod'
import { ImageSchema } from '@jerry/facility-config'
import { Section, Container, Text } from '../primitives'
import { SectionHeader, MediaBlock } from '../compositions'
import type { SectionProps } from '../renderer/registry'

export const ContentSectionContentSchema = z.object({
  heading: z.string().min(1),
  blurb: z.string().optional(),
  paragraphs: z.array(z.string()).optional(),
  image: ImageSchema.optional(),
})

type ContentSectionContent = z.infer<typeof ContentSectionContentSchema>

export function ContentSection({ content, layout, variant = 'clean' }: SectionProps) {
  const c = content as unknown as ContentSectionContent

  const textContent = (
    <>
      <SectionHeader heading={c.heading} description={c.blurb} level="2" align="left" />
      {c.paragraphs?.map((p, i) => (
        <Text as="p" size="3" mt="3" key={i}>{p}</Text>
      ))}
    </>
  )

  const borderStyle: React.CSSProperties =
    variant === 'bordered'
      ? { border: '1px solid var(--gray-6, #ddd)', borderRadius: '8px', padding: '2rem' }
      : variant === 'soft'
        ? { backgroundColor: 'var(--gray-2, #fafafa)', borderRadius: '8px', padding: '2rem' }
        : {}

  return (
    <Section>
      <Container>
        <div style={borderStyle}>
          {c.image ? (
            <MediaBlock
              image={c.image}
              layout={(layout as 'image-right' | 'image-left' | 'stacked') ?? 'image-right'}
            >
              {textContent}
            </MediaBlock>
          ) : (
            textContent
          )}
        </div>
      </Container>
    </Section>
  )
}
