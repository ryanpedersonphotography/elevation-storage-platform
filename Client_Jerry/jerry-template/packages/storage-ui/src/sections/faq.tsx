'use client'
import React, { useState } from 'react'
import { z } from 'zod'
import { Section, Container, Box, Text, Flex } from '../primitives'
import { SectionHeader } from '../compositions'
import type { SectionProps } from '../renderer/registry'

export const FAQContentSchema = z.object({
  heading: z.string().min(1),
  blurb: z.string().optional(),
  items: z.array(z.object({
    question: z.string().min(1),
    answer: z.string().min(1),
  })).optional(),
})

type FAQContent = z.infer<typeof FAQContentSchema>

interface FAQItem {
  question: string
  answer: string
}

function AccordionItem({ question, answer }: FAQItem) {
  const [open, setOpen] = useState(false)

  return (
    <Box style={{ borderBottom: '1px solid var(--gray-a5)' }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          padding: '1.25rem 0',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
          fontSize: 'inherit',
          fontFamily: 'inherit',
          color: 'inherit',
        }}
      >
        <Text as="span" size="3" weight="bold">{question}</Text>
        <Text as="span" size="4" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
          &#9662;
        </Text>
      </button>
      {open && (
        <Box pb="4">
          <Text as="p" size="2" color="gray">{answer}</Text>
        </Box>
      )}
    </Box>
  )
}

export function FAQ({ content, variant = 'accordion', facilityData }: SectionProps) {
  const c = content as unknown as FAQContent
  const items: FAQItem[] = c.items ?? (facilityData?.data as any)?.faq ?? []

  return (
    <Section>
      <Container size="2">
        <SectionHeader heading={c.heading} description={c.blurb} level="2" />
        {variant === 'list' ? (
          <Flex direction="column" gap="5">
            {items.map((item, i) => (
              <Box key={i}>
                <Text as="p" size="3" weight="bold" mb="1">{item.question}</Text>
                <Text as="p" size="2" color="gray">{item.answer}</Text>
              </Box>
            ))}
          </Flex>
        ) : (
          <Box style={{ borderTop: '1px solid var(--gray-a5)' }}>
            {items.map((item, i) => (
              <AccordionItem key={i} question={item.question} answer={item.answer} />
            ))}
          </Box>
        )}
      </Container>
    </Section>
  )
}
