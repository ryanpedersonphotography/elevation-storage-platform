'use client'
import React, { useState, useCallback } from 'react'
import { z } from 'zod'
import { Section, Container, TextField, TextArea, Select, Button, Text, Box, Flex, Card } from '../primitives'
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
  name: 'Full Name',
  email: 'Email Address',
  phone: 'Phone Number',
  unitSize: 'Unit Size',
  moveInDate: 'Move-in Date',
  message: 'Message',
}

const fieldPlaceholders: Record<string, string> = {
  name: 'John Smith',
  email: 'john@example.com',
  phone: '(555) 123-4567',
  unitSize: 'Select a size',
  moveInDate: '',
  message: 'Tell us about your storage needs...',
}

/** Fields that span full width in the two-column layout */
const FULL_WIDTH_FIELDS = new Set(['message', 'moveInDate'])

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Flex direction="column" gap="2">
      <Text as="label" size="2" weight="medium">{label}</Text>
      {children}
    </Flex>
  )
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
          <Card size="4">
            <Flex direction="column" align="center" gap="3" py="8">
              <Text as="p" size="5" weight="bold" data-testid="success-message">
                {c.successMessage}
              </Text>
              <Text as="p" size="3" color="gray">
                We&apos;ll be in touch soon.
              </Text>
            </Flex>
          </Card>
        </Container>
      </Section>
    )
  }

  // Split fields into pairs for two-column layout
  const halfFields = c.fields.filter((f) => !FULL_WIDTH_FIELDS.has(f))
  const fullFields = c.fields.filter((f) => FULL_WIDTH_FIELDS.has(f))

  // Pair up half-width fields: [name, email], [phone, unitSize], etc.
  const rows: { left: string; right?: string }[] = []
  for (let i = 0; i < halfFields.length; i += 2) {
    rows.push({ left: halfFields[i], right: halfFields[i + 1] })
  }

  function renderField(field: string) {
    if (field === 'message') {
      return (
        <FormField label={fieldLabels[field]} key={field}>
          <TextArea
            name={field}
            placeholder={fieldPlaceholders[field]}
            rows={5}
            size="3"
          />
        </FormField>
      )
    }

    if (field === 'unitSize') {
      return (
        <FormField label={fieldLabels[field]} key={field}>
          <Select.Root name={field} size="3">
            <Select.Trigger placeholder={fieldPlaceholders[field]} />
            <Select.Content>
              {unitSizes.map((size) => (
                <Select.Item key={size} value={size}>{size}</Select.Item>
              ))}
            </Select.Content>
          </Select.Root>
        </FormField>
      )
    }

    const inputType =
      field === 'email' ? 'email' :
      field === 'phone' ? 'tel' :
      field === 'moveInDate' ? 'date' : 'text'

    return (
      <FormField label={fieldLabels[field]} key={field}>
        <TextField.Root
          name={field}
          type={inputType}
          placeholder={fieldPlaceholders[field]}
          size="3"
        />
      </FormField>
    )
  }

  return (
    <Section>
      <Container size={variant === 'minimal' ? '2' : '3'}>
        <SectionHeader heading={c.heading} description={c.blurb} level="2" />
        <Card size="4">
          <form onSubmit={handleSubmit}>
            <Flex direction="column" gap="5">
              {/* Paired half-width fields */}
              {rows.map((row) => (
                <Flex key={row.left} direction={{ initial: 'column', sm: 'row' }} gap="5">
                  <Box flexGrow="1" flexBasis="0%">
                    {renderField(row.left)}
                  </Box>
                  {row.right ? (
                    <Box flexGrow="1" flexBasis="0%">
                      {renderField(row.right)}
                    </Box>
                  ) : (
                    <Box flexGrow="1" flexBasis="0%" />
                  )}
                </Flex>
              ))}

              {/* Full-width fields */}
              {fullFields.map((field) => renderField(field))}

              {/* Submit */}
              <Flex justify="end" pt="2">
                <Button type="submit" size="3" highContrast>
                  {c.submitLabel}
                </Button>
              </Flex>
            </Flex>
          </form>
        </Card>
      </Container>
    </Section>
  )
}
