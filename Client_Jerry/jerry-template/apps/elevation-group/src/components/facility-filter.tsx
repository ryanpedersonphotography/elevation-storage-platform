'use client'
import React, { useState, useMemo } from 'react'
import { Flex, Text, Box, Grid, Badge, Button, TextField, Select } from '@radix-ui/themes'
import { FacilityCard } from '@jerry/storage-ui'
import { Search, X, MapPin } from 'lucide-react'
import type { FacilityConfig } from '@jerry/facility-config/schema'

interface FacilityFilterProps {
  facilities: FacilityConfig[]
  /** "search" renders just the search input row (for hero card). "grid" renders the full filter + card grid. */
  variant?: 'search' | 'grid'
}

function getStates(facilities: FacilityConfig[]): string[] {
  const states = new Set(facilities.map((f) => f.info.address.state))
  return Array.from(states).sort()
}

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

function formatFeature(feature: string): string {
  return feature
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

export function FacilityFilter({ facilities, variant = 'grid' }: FacilityFilterProps) {
  const [search, setSearch] = useState('')
  const [stateFilter, setStateFilter] = useState<string>('all')
  const [featureFilters, setFeatureFilters] = useState<Set<string>>(new Set())

  const states = useMemo(() => getStates(facilities), [facilities])
  const allFeatures = useMemo(() => getFeatures(facilities), [facilities])

  const toggleFeature = (feature: string) => {
    setFeatureFilters((prev) => {
      const next = new Set(prev)
      if (next.has(feature)) next.delete(feature)
      else next.add(feature)
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
        const haystack = [f.name, f.info.address.city, f.info.address.state, f.info.address.zip, f.info.address.street]
          .join(' ').toLowerCase()
        if (!haystack.includes(q)) return false
      }
      if (stateFilter !== 'all' && f.info.address.state !== stateFilter) return false
      if (featureFilters.size > 0) {
        const fFeats = new Set(f.data.units.flatMap((u) => u.features))
        for (const req of featureFilters) {
          if (!fFeats.has(req)) return false
        }
      }
      return true
    })
  }, [facilities, search, stateFilter, featureFilters])

  const hasActiveFilters = search || stateFilter !== 'all' || featureFilters.size > 0

  // ── Search-only variant (for hero card) ──
  if (variant === 'search') {
    return (
      <Flex gap="2" align="end" wrap="wrap">
        <Box flexGrow="1">
          <TextField.Root
            placeholder="Zip or City, State"
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            size="3"
          >
            <TextField.Slot>
              <Search size={16} />
            </TextField.Slot>
          </TextField.Root>
        </Box>
        <Button size="3" variant="solid" highContrast asChild>
          <a href="#locations">Search</a>
        </Button>
        <Text size="2" color="gray" className="self-center">or</Text>
        <Button size="3" variant="solid" highContrast>
          <MapPin size={16} /> Near Me
        </Button>
      </Flex>
    )
  }

  // ── Full grid variant ──
  return (
    <>
      {/* Filter bar */}
      <Box mb="5" className="bg-[var(--gray-a2)] rounded-[var(--radius-3)] border border-[var(--gray-a4)]">
        <Flex gap="3" wrap="wrap" align="end" p="4">
          <Box flexGrow="1" className="min-w-48">
            <Text as="label" size="1" weight="medium" mb="1" className="block">Search</Text>
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

          <Box className="min-w-36">
            <Text as="label" size="1" weight="medium" mb="1" className="block">State</Text>
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
            <Button variant="ghost" size="2" onClick={clearFilters}>
              <X size={14} /> Clear
            </Button>
          )}
        </Flex>

        <Flex gap="2" px="4" pb="4" wrap="wrap">
          <Text size="1" weight="medium" className="self-center">Features:</Text>
          {allFeatures.map((feature) => (
            <Badge
              key={feature}
              size="2"
              variant={featureFilters.has(feature) ? 'solid' : 'outline'}
              className="cursor-pointer"
              onClick={() => toggleFeature(feature)}
            >
              {formatFeature(feature)}
            </Badge>
          ))}
        </Flex>
      </Box>

      {/* Results count */}
      <Flex justify="between" align="center" mb="4">
        <Text size="2" color="gray">
          {filtered.length === facilities.length
            ? `Showing all ${facilities.length} locations`
            : `Showing ${filtered.length} of ${facilities.length} locations`}
        </Text>
        {hasActiveFilters && (
          <Badge size="1" variant="soft">Filtered</Badge>
        )}
      </Flex>

      {/* Card grid */}
      {filtered.length > 0 ? (
        <Grid columns={{ initial: '1', sm: '2', md: '3' }} gap="5">
          {filtered.map((facility) => (
            <a key={facility.slug} href={`/${facility.slug}`} className="no-underline text-inherit block">
              <Box className="facility-card-hover transition-all">
                <FacilityCard facility={facility} href={`/${facility.slug}`} />
              </Box>
            </a>
          ))}
        </Grid>
      ) : (
        <Flex direction="column" align="center" gap="3" py="8">
          <Text size="4" color="gray">No facilities match your filters.</Text>
          <Button variant="soft" size="2" onClick={clearFilters}>Clear Filters</Button>
        </Flex>
      )}
    </>
  )
}
