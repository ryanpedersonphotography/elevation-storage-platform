'use client'
import React, { useState, useMemo } from 'react'
import { Flex, Text, Box, Grid, Badge, Button, TextField, Select, Card, Heading } from '@radix-ui/themes'
import { Search, X, Phone } from 'lucide-react'

/** Serialized facility data — no imports from server packages */
export interface SerializedFacility {
  slug: string
  name: string
  info: {
    address: { street: string; city: string; state: string; zip: string }
    phone: string
    image?: { src: string; alt: string }
    directionsUrl?: string
  }
  data: {
    units: { id: string; features: string[] }[]
    testimonials: { name: string; rating: number; text: string }[]
  }
}

interface FacilityFilterProps {
  facilities: SerializedFacility[]
}

function getStates(facilities: SerializedFacility[]): string[] {
  const states = new Set(facilities.map((f) => f.info.address.state))
  return Array.from(states).sort()
}

function getFeatures(facilities: SerializedFacility[]): string[] {
  const features = new Set<string>()
  for (const f of facilities) {
    for (const u of f.data.units) {
      for (const feat of u.features) {
        features.add(feat)
      }
    }
  }
  return Array.from(features).sort()
}

function formatFeature(feature: string): string {
  return feature
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

/** Inline facility card — avoids importing from @jerry/storage-ui barrel */
function FacilityCardInline({ facility, href }: { facility: SerializedFacility; href: string }) {
  const { info, data } = facility
  const addr = info.address
  const reviewCount = data.testimonials.length
  const unitCount = data.units.length
  const directionsUrl = info.directionsUrl ??
    `https://www.google.com/maps/search/?api=1&query=${addr.street}+${addr.city}+${addr.state}+${addr.zip}`

  return (
    <Card style={{ overflow: 'hidden' }}>
      {info.image && (
        <img
          src={info.image.src}
          alt={info.image.alt}
          loading="lazy"
          style={{ width: '100%', height: 'auto', objectFit: 'cover', aspectRatio: '16/9' }}
        />
      )}
      <Box p="4">
        <Heading as="h3" size="4" mb="2">{facility.name}</Heading>
        <Flex direction="column" gap="1" mb="3">
          <Text as="p" size="2" color="gray">{addr.street}</Text>
          <Text as="p" size="2" color="gray">{addr.city}, {addr.state} {addr.zip}</Text>
        </Flex>
        <Box mb="3">
          <a href={`tel:${info.phone}`} style={{ textDecoration: 'none', color: 'inherit', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            <Phone size={12} />
            <Text as="span" size="2" weight="bold">{info.phone}</Text>
          </a>
        </Box>
        <Flex gap="2" mb="3" wrap="wrap">
          <Button variant="outline" size="2" asChild>
            <a href={directionsUrl} target="_blank" rel="noopener noreferrer">Get Directions</a>
          </Button>
          <Button variant="solid" size="2" asChild>
            <a href={href}>View Facility</a>
          </Button>
        </Flex>
        <Flex justify="between" align="center">
          {reviewCount > 0 && (
            <Badge size="1" variant="soft">Reviews ({reviewCount})</Badge>
          )}
          {unitCount > 0 && (
            <a href={`${href}/units`} style={{ textDecoration: 'none' }}>
              <Text as="span" size="2" weight="bold" style={{ color: 'var(--accent-9)' }}>
                Available Units
              </Text>
            </a>
          )}
        </Flex>
      </Box>
    </Card>
  )
}

export function FacilityFilter({ facilities }: FacilityFilterProps) {
  const [search, setSearch] = useState('')
  const [stateFilter, setStateFilter] = useState<string>('all')
  const [featureFilters, setFeatureFilters] = useState<Set<string>>(new Set())

  const states = useMemo(() => getStates(facilities), [facilities])
  const allFeatures = useMemo(() => getFeatures(facilities), [facilities])

  const toggleFeature = (feature: string) => {
    setFeatureFilters((prev) => {
      const next = new Set(prev)
      if (next.has(feature)) {
        next.delete(feature)
      } else {
        next.add(feature)
      }
      return next
    })
  }

  const clearFilters = () => {
    setSearch('')
    setStateFilter('all')
    setFeatureFilters(new Set())
  }

  const filtered = useMemo(() => {
    return facilities.filter((f) => {
      if (search) {
        const q = search.toLowerCase()
        const searchable = [
          f.name,
          f.info.address.city,
          f.info.address.state,
          f.info.address.zip,
          f.info.address.street,
        ]
          .join(' ')
          .toLowerCase()
        if (!searchable.includes(q)) return false
      }

      if (stateFilter !== 'all' && f.info.address.state !== stateFilter) {
        return false
      }

      if (featureFilters.size > 0) {
        const facilityFeatures = new Set<string>()
        for (const u of f.data.units) {
          for (const feat of u.features) {
            facilityFeatures.add(feat)
          }
        }
        for (const required of featureFilters) {
          if (!facilityFeatures.has(required)) return false
        }
      }

      return true
    })
  }, [facilities, search, stateFilter, featureFilters])

  const hasActiveFilters = search || stateFilter !== 'all' || featureFilters.size > 0

  return (
    <>
      {/* Filter Bar */}
      <Box
        mb="5"
        p="4"
        style={{
          backgroundColor: 'var(--gray-2)',
          borderRadius: 'var(--radius-3)',
          border: '1px solid var(--gray-a4)',
        }}
      >
        <Flex gap="3" wrap="wrap" align="end">
          <Box style={{ flex: '1 1 200px', minWidth: '200px' }}>
            <Text as="label" size="1" weight="medium" mb="1" style={{ display: 'block' }}>
              Search
            </Text>
            <TextField.Root
              placeholder="City, state, or zip..."
              value={search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
              size="2"
            >
              <TextField.Slot>
                <Search size={14} />
              </TextField.Slot>
            </TextField.Root>
          </Box>

          <Box style={{ minWidth: '140px' }}>
            <Text as="label" size="1" weight="medium" mb="1" style={{ display: 'block' }}>
              State
            </Text>
            <Select.Root value={stateFilter} onValueChange={setStateFilter} size="2">
              <Select.Trigger placeholder="All States" />
              <Select.Content>
                <Select.Item value="all">All States</Select.Item>
                {states.map((s) => (
                  <Select.Item key={s} value={s}>{s}</Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
          </Box>

          {hasActiveFilters && (
            <Button variant="ghost" size="2" onClick={clearFilters} style={{ alignSelf: 'end' }}>
              <X size={14} /> Clear
            </Button>
          )}
        </Flex>

        <Flex gap="2" mt="3" wrap="wrap">
          <Text size="1" weight="medium" style={{ alignSelf: 'center' }}>Features:</Text>
          {allFeatures.map((feature) => {
            const active = featureFilters.has(feature)
            return (
              <Badge
                key={feature}
                size="2"
                variant={active ? 'solid' : 'outline'}
                style={{ cursor: 'pointer' }}
                onClick={() => toggleFeature(feature)}
              >
                {formatFeature(feature)}
              </Badge>
            )
          })}
        </Flex>
      </Box>

      {/* Results */}
      <Flex justify="between" align="center" mb="4">
        <Text size="2" color="gray">
          {filtered.length === facilities.length
            ? `Showing all ${facilities.length} locations`
            : `Showing ${filtered.length} of ${facilities.length} locations`}
        </Text>
        {hasActiveFilters && (
          <Badge size="1" variant="soft" color="blue">Filtered</Badge>
        )}
      </Flex>

      {filtered.length > 0 ? (
        <Grid columns={{ initial: '1', sm: '2', md: '3' }} gap="5">
          {filtered.map((facility) => (
            <FacilityCardInline
              key={facility.slug}
              facility={facility}
              href={`/${facility.slug}`}
            />
          ))}
        </Grid>
      ) : (
        <Box py="8" style={{ textAlign: 'center' }}>
          <Text size="4" color="gray">No facilities match your filters.</Text>
          <Box mt="3">
            <Button variant="soft" size="2" onClick={clearFilters}>Clear Filters</Button>
          </Box>
        </Box>
      )}
    </>
  )
}
