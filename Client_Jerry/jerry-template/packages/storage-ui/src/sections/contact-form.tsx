'use client'
import React, { useState, useCallback } from 'react'
import { z } from 'zod'
import { Section, Container, TextField, TextArea, Select, Button, Text, Box } from '../primitives'
import { SectionHeader } from '../compositions'
import { useAnalytics } from '../hooks/use-analytics'
import type { SectionProps } from '../renderer/registry'

export const ContactFormContentSchema = z.object({
  heading: z.string().min(1),
  blurb: z.string().optional(),
  fields: z.array(z.enum(['name', 'email', 'phone', 'unitSize', 'moveInDate', 'message'])),
  submitLabel: z.string().min(1),
  successMessage: z.string().min(1),
})

type ContactFormContent = z.infer<typeof ContactFormContentSchema>

const fieldLabels: Record<string, string> = {
  name: 'Name',
  email: 'Email',
  phone: 'Phone',
  unitSize: 'Unit Size',
  moveInDate: 'Move-in Date',
  message: 'Message',
}

export function ContactForm({ content, variant = 'standard', facilityData }: SectionProps) {
  const c = content as unknown as ContactFormContent
  const [submitted, setSubmitted] = useState(false)
  const { track } = useAnalytics()

  const unitSizes = facilityData?.data?.units?.map((u) => u.size) ?? []

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    track('reserve_click')
    setSubmitted(true)
  }, [track])

  if (submitted) {
    return (
      <Section>
        <Container>
          <Box style={{ textAlign: 'center', padding: '3rem 0' }}>
            <Text as="p" size="4" data-testid="success-message">{c.successMessage}</Text>
          </Box>
        </Container>
      </Section>
    )
  }

  return (
    <Section>
      <Container size={variant === 'minimal' ? '2' : '3'}>
        <SectionHeader heading={c.heading} description={c.blurb} level="2" />
        <form onSubmit={handleSubmit}>
          <Box style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '32rem', margin: '0 auto' }}>
            {c.fields.map((field) => {
              if (field === 'message') {
                return (
                  <label key={field}>
                    <Text as="p" size="2" mb="1" weight="medium">{fieldLabels[field]}</Text>
                    <TextArea name={field} placeholder={fieldLabels[field]} rows={4} />
                  </label>
                )
              }
              if (field === 'unitSize') {
                return (
                  <label key={field}>
                    <Text as="p" size="2" mb="1" weight="medium">{fieldLabels[field]}</Text>
                    <Select.Root name={field}>
                      <Select.Trigger placeholder="Select a size" />
                      <Select.Content>
                        {unitSizes.map((size) => (
                          <Select.Item key={size} value={size}>{size}</Select.Item>
                        ))}
                      </Select.Content>
                    </Select.Root>
                  </label>
                )
              }
              const inputType =
                field === 'email' ? 'email' :
                field === 'phone' ? 'tel' :
                field === 'moveInDate' ? 'date' : 'text'
              return (
                <label key={field}>
                  <Text as="p" size="2" mb="1" weight="medium">{fieldLabels[field]}</Text>
                  <TextField.Root
                    name={field}
                    type={inputType}
                    placeholder={fieldLabels[field]}
                  />
                </label>
              )
            })}
            <Button type="submit" size="3">{c.submitLabel}</Button>
          </Box>
        </form>
      </Container>
    </Section>
  )
}
