'use client'
import React, { useState, useMemo } from 'react'
import { Flex, Text, Box, Grid, Badge, Button, TextField, Select } from '@radix-ui/themes'
import { FacilityCard } from '@jerry/storage-ui'
import { Search, X } from 'lucide-react'
import type { FacilityConfig } from '@jerry/facility-config'

interface FacilityFilterProps {
  facilities: FacilityConfig[]
}

/** Extract unique states from facilities */
function getStates(facilities: FacilityConfig[]): string[] {
  const states = new Set(facilities.map((f) => f.info.address.state))
  return Array.from(states).sort()
}

/** Extract unique unit features across all facilities */
function getFeatures(facilities: FacilityConfig[]): string[] {
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

/** Pretty-print a feature name */
function formatFeature(feature: string): string {
  return feature
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
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
      // Text search: name, city, state, zip
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

      // State filter
      if (stateFilter !== 'all' && f.info.address.state !== stateFilter) {
        return false
      }

      // Feature filters (facility must have at least one unit with ALL selected features)
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
          {/* Search */}
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

          {/* State */}
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

          {/* Clear */}
          {hasActiveFilters && (
            <Button variant="ghost" size="2" onClick={clearFilters} style={{ alignSelf: 'end' }}>
              <X size={14} /> Clear
            </Button>
          )}
        </Flex>

        {/* Feature toggles */}
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

      {/* Results header */}
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

      {/* Grid */}
      {filtered.length > 0 ? (
        <Grid columns={{ initial: '1', sm: '2', md: '3' }} gap="5">
          {filtered.map((facility) => (
            <FacilityCard
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
