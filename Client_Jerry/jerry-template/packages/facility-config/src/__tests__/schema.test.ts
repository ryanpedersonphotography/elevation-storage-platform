import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { FacilityConfigSchema, PageSchema, SectionSchema, OklchSchema } from '../schema'

// ─── Helpers ───

const FIXTURES_DIR = join(__dirname, '../../../../data/fixtures')

function loadFixture(name: string): unknown {
  const raw = readFileSync(join(FIXTURES_DIR, name), 'utf-8')
  return JSON.parse(raw)
}

function makeMinimalFacility(overrides: Record<string, unknown> = {}): unknown {
  const base = loadFixture('test-facility.json') as Record<string, unknown>
  return { ...base, ...overrides }
}

// ─── Schema Tests ───

describe('FacilityConfigSchema', () => {
  it('accepts a valid facility config (test fixture)', () => {
    const data = loadFixture('test-facility.json')
    const result = FacilityConfigSchema.safeParse(data)
    expect(result.success).toBe(true)
  })

  it('accepts the full smithtown seed data', () => {
    const raw = readFileSync(
      join(__dirname, '../../../../data/facilities/smithtown.json'),
      'utf-8'
    )
    const data = JSON.parse(raw)
    const result = FacilityConfigSchema.safeParse(data)
    if (!result.success) {
      console.error(result.error.format())
    }
    expect(result.success).toBe(true)
  })
})

describe('OklchSchema', () => {
  it('accepts valid oklch values', () => {
    expect(OklchSchema.safeParse('oklch(0.55 0.15 250)').success).toBe(true)
    expect(OklchSchema.safeParse('oklch(0.7 0.18 30)').success).toBe(true)
    expect(OklchSchema.safeParse('oklch(1 0 0)').success).toBe(true)
  })

  it('rejects invalid oklch values', () => {
    // Missing parentheses
    expect(OklchSchema.safeParse('oklch 0.55 0.15 250').success).toBe(false)
    // Extra parameter
    expect(OklchSchema.safeParse('oklch(0.55 0.15 250 / 0.5)').success).toBe(false)
    // CSS injection attempt
    expect(OklchSchema.safeParse('oklch(0.55 0.15 250); background: red').success).toBe(false)
    // Hex color
    expect(OklchSchema.safeParse('#ff0000').success).toBe(false)
    // RGB
    expect(OklchSchema.safeParse('rgb(255, 0, 0)').success).toBe(false)
    // Empty string
    expect(OklchSchema.safeParse('').success).toBe(false)
  })
})

describe('PageSchema — layout/sections cross-validation', () => {
  it('rejects when layout references a section that does not exist', () => {
    const page = {
      enabled: true,
      seo: {},
      layout: ['hero', 'missing-section'],
      sections: {
        hero: {
          component: 'Hero',
          content: { heading: 'Test', image: { src: '/t.jpg', alt: 'test' } },
        },
      },
    }
    const result = PageSchema.safeParse(page)
    expect(result.success).toBe(false)
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message)
      expect(messages).toContain(
        'Layout references section "missing-section" but it is not defined in sections'
      )
    }
  })

  it('rejects duplicate layout keys', () => {
    const page = {
      enabled: true,
      seo: {},
      layout: ['hero', 'hero'],
      sections: {
        hero: {
          component: 'Hero',
          content: { heading: 'Test', image: { src: '/t.jpg', alt: 'test' } },
        },
      },
    }
    const result = PageSchema.safeParse(page)
    expect(result.success).toBe(false)
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message)
      expect(messages).toContain('Duplicate section key "hero" in layout array')
    }
  })

  it('rejects sections defined but not referenced in layout (dead sections)', () => {
    const page = {
      enabled: true,
      seo: {},
      layout: ['hero'],
      sections: {
        hero: {
          component: 'Hero',
          content: { heading: 'Test', image: { src: '/t.jpg', alt: 'test' } },
        },
        orphan: {
          component: 'CallToAction',
          content: { heading: 'Orphan', cta: { label: 'Go', href: '/go', variant: 'primary' } },
        },
      },
    }
    const result = PageSchema.safeParse(page)
    expect(result.success).toBe(false)
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message)
      expect(messages).toContain(
        'Section "orphan" is defined but not referenced in layout (dead section)'
      )
    }
  })

  it('skips cross-validation for disabled pages', () => {
    const page = {
      enabled: false,
      seo: {},
      layout: [],
      sections: {},
    }
    const result = PageSchema.safeParse(page)
    expect(result.success).toBe(true)
  })

  it('skips cross-validation for disabled pages even with mismatched layout/sections', () => {
    const page = {
      enabled: false,
      seo: {},
      layout: ['nonexistent'],
      sections: {
        orphan: {
          component: 'Hero',
          content: {
            heading: 'Test',
            image: { src: '/test.jpg', alt: 'test' },
          },
        },
      },
    }
    const result = PageSchema.safeParse(page)
    expect(result.success).toBe(true)
  })
})

describe('SectionSchema — variant validation', () => {
  it('accepts valid variant for a component', () => {
    const section = {
      component: 'Hero',
      variant: 'overlay',
      content: {
        heading: 'Test',
        image: { src: '/test.jpg', alt: 'test' },
      },
    }
    const result = SectionSchema.safeParse(section)
    expect(result.success).toBe(true)
  })

  it('rejects invalid variant for a component', () => {
    const section = {
      component: 'Hero',
      variant: 'nonexistent',
      content: { heading: 'Test', image: { src: '/t.jpg', alt: 'test' } },
    }
    const result = SectionSchema.safeParse(section)
    expect(result.success).toBe(false)
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message)
      expect(messages.some((m) => m.includes('Invalid variant "nonexistent" for Hero'))).toBe(true)
    }
  })

  it('accepts section without variant (optional)', () => {
    const section = {
      component: 'ContentSection',
      content: { heading: 'Test Content' },
    }
    const result = SectionSchema.safeParse(section)
    expect(result.success).toBe(true)
  })

  it('rejects unknown component name', () => {
    const section = {
      component: 'UnknownWidget',
      content: {},
    }
    const result = SectionSchema.safeParse(section)
    expect(result.success).toBe(false)
  })

  it('validates each component variant mapping', () => {
    // Provide valid content for each component
    const validContentByComponent: Record<string, Record<string, unknown>> = {
      Hero: { heading: 'Test', image: { src: '/img.jpg', alt: 'test' } },
      HeroSimple: { heading: 'Test' },
      ContentSection: { heading: 'Test' },
      UnitGrid: { heading: 'Test' },
      FeatureGrid: { heading: 'Test' },
      CallToAction: { heading: 'Test', cta: { label: 'Click', href: '/go', variant: 'primary' } },
      ContactForm: { heading: 'Test', fields: ['name', 'email'], submitLabel: 'Send', successMessage: 'Done' },
      MapSection: { heading: 'Test' },
      TestimonialGrid: { heading: 'Test' },
      SizeGuide: { heading: 'Test', guides: [{ size: '5x5', description: 'Small', fits: ['Boxes'] }] },
      FacilityDirectory: { heading: 'Test' },
    }
    const validPairs: [string, string][] = [
      ['Hero', 'wave'],
      ['HeroSimple', 'colored'],
      ['ContentSection', 'soft'],
      ['UnitGrid', 'compact'],
      ['FeatureGrid', 'pills'],
      ['CallToAction', 'rounded'],
      ['ContactForm', 'minimal'],
      ['MapSection', 'static'],
      ['TestimonialGrid', 'quotes'],
      ['SizeGuide', 'table'],
      ['FacilityDirectory', 'map'],
    ]
    for (const [component, variant] of validPairs) {
      const content = validContentByComponent[component] ?? {}
      const result = SectionSchema.safeParse({ component, variant, content })
      expect(result.success, `${component}/${variant} should be valid`).toBe(true)
    }
  })
})

describe('HoursSchema (via FacilityConfigSchema)', () => {
  it('rejects malformed hours — invalid day code', () => {
    const data = makeMinimalFacility({
      info: {
        address: { street: '1 St', city: 'C', state: 'CA', zip: '90000' },
        phone: '555-0000',
        email: 'a@b.com',
        coordinates: { lat: 0, lng: 0 },
        hours: [{ days: ['Monday'], open: '09:00', close: '17:00' }],
      },
    })
    const result = FacilityConfigSchema.safeParse(data)
    expect(result.success).toBe(false)
  })

  it('rejects malformed hours — invalid time format', () => {
    const data = makeMinimalFacility({
      info: {
        address: { street: '1 St', city: 'C', state: 'CA', zip: '90000' },
        phone: '555-0000',
        email: 'a@b.com',
        coordinates: { lat: 0, lng: 0 },
        hours: [{ days: ['Mo'], open: '9am', close: '5pm' }],
      },
    })
    const result = FacilityConfigSchema.safeParse(data)
    expect(result.success).toBe(false)
  })

  it('rejects empty hours array', () => {
    const data = makeMinimalFacility({
      info: {
        address: { street: '1 St', city: 'C', state: 'CA', zip: '90000' },
        phone: '555-0000',
        email: 'a@b.com',
        coordinates: { lat: 0, lng: 0 },
        hours: [],
      },
    })
    const result = FacilityConfigSchema.safeParse(data)
    expect(result.success).toBe(false)
  })
})

describe('Template enum', () => {
  it('accepts valid templates', () => {
    for (const template of ['modern', 'bold', 'friendly']) {
      const data = makeMinimalFacility({
        branding: {
          showParent: true,
          template,
          colors: { primary: 'oklch(0.5 0.1 200)', accent: 'oklch(0.5 0.1 200)' },
          logo: '/logo.png',
        },
      })
      const result = FacilityConfigSchema.safeParse(data)
      expect(result.success, `template "${template}" should be valid`).toBe(true)
    }
  })

  it('rejects invalid template', () => {
    const data = makeMinimalFacility({
      branding: {
        showParent: true,
        template: 'retro',
        colors: { primary: 'oklch(0.5 0.1 200)', accent: 'oklch(0.5 0.1 200)' },
        logo: '/logo.png',
      },
    })
    const result = FacilityConfigSchema.safeParse(data)
    expect(result.success).toBe(false)
  })
})

describe('Deployment mode', () => {
  it('accepts subdirectory mode', () => {
    const data = makeMinimalFacility({
      deployment: { mode: 'subdirectory', domain: null },
    })
    const result = FacilityConfigSchema.safeParse(data)
    expect(result.success).toBe(true)
  })

  it('accepts standalone mode', () => {
    const data = makeMinimalFacility({
      deployment: { mode: 'standalone', domain: 'example.com' },
    })
    const result = FacilityConfigSchema.safeParse(data)
    expect(result.success).toBe(true)
  })

  it('rejects invalid mode', () => {
    const data = makeMinimalFacility({
      deployment: { mode: 'hybrid', domain: null },
    })
    const result = FacilityConfigSchema.safeParse(data)
    expect(result.success).toBe(false)
  })
})

describe('Analytics', () => {
  it('accepts analytics with null gtag', () => {
    const data = makeMinimalFacility({ analytics: { gtag: null } })
    const result = FacilityConfigSchema.safeParse(data)
    expect(result.success).toBe(true)
  })

  it('accepts omitted analytics', () => {
    const facility = makeMinimalFacility() as Record<string, unknown>
    const { analytics: _, ...withoutAnalytics } = facility
    const result = FacilityConfigSchema.safeParse(withoutAnalytics)
    expect(result.success).toBe(true)
  })
})

describe('Integrations', () => {
  it('accepts empty integrations object', () => {
    const data = makeMinimalFacility({ integrations: {} })
    const result = FacilityConfigSchema.safeParse(data)
    expect(result.success).toBe(true)
  })

  it('accepts omitted integrations', () => {
    const facility = makeMinimalFacility() as Record<string, unknown>
    const { integrations: _, ...withoutIntegrations } = facility
    const result = FacilityConfigSchema.safeParse(withoutIntegrations)
    expect(result.success).toBe(true)
  })
})

describe('Content schema validation (SCHEMA-01)', () => {
  it('rejects Hero with missing image', () => {
    const section = {
      component: 'Hero',
      content: { heading: 'Test' },
    }
    const result = SectionSchema.safeParse(section)
    expect(result.success).toBe(false)
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message)
      expect(messages.some((m) => m.includes('Hero content'))).toBe(true)
    }
  })

  it('rejects CallToAction with missing cta', () => {
    const section = {
      component: 'CallToAction',
      content: { heading: 'Test' },
    }
    const result = SectionSchema.safeParse(section)
    expect(result.success).toBe(false)
  })

  it('rejects ContactForm with missing required fields', () => {
    const section = {
      component: 'ContactForm',
      content: { heading: 'Test' },
    }
    const result = SectionSchema.safeParse(section)
    expect(result.success).toBe(false)
  })

  it('accepts Hero with valid content', () => {
    const section = {
      component: 'Hero',
      content: {
        heading: 'Valid',
        image: { src: '/hero.jpg', alt: 'Hero image' },
      },
    }
    const result = SectionSchema.safeParse(section)
    expect(result.success).toBe(true)
  })
})

describe('Standalone deployment validation (SEO-02, SCHEMA-03)', () => {
  it('rejects standalone mode with null domain', () => {
    const data = makeMinimalFacility({
      deployment: { mode: 'standalone', domain: null },
    })
    const result = FacilityConfigSchema.safeParse(data)
    expect(result.success).toBe(false)
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message)
      expect(messages).toContain(
        'domain is required when deployment.mode is "standalone"'
      )
    }
  })

  it('accepts standalone mode with valid domain', () => {
    const data = makeMinimalFacility({
      deployment: { mode: 'standalone', domain: 'example.com' },
    })
    const result = FacilityConfigSchema.safeParse(data)
    expect(result.success).toBe(true)
  })

  it('rejects FacilityDirectory in standalone mode', () => {
    const data = makeMinimalFacility({
      deployment: { mode: 'standalone', domain: 'example.com' },
      pages: {
        home: {
          enabled: true,
          seo: {},
          layout: ['directory'],
          sections: {
            directory: {
              component: 'FacilityDirectory',
              content: { heading: 'Locations' },
            },
          },
        },
      },
    })
    const result = FacilityConfigSchema.safeParse(data)
    expect(result.success).toBe(false)
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message)
      expect(messages).toContain(
        'FacilityDirectory is not allowed in standalone deployments'
      )
    }
  })

  it('accepts FacilityDirectory in subdirectory mode', () => {
    const data = makeMinimalFacility({
      deployment: { mode: 'subdirectory', domain: null },
      pages: {
        home: {
          enabled: true,
          seo: {},
          layout: ['directory'],
          sections: {
            directory: {
              component: 'FacilityDirectory',
              content: { heading: 'Locations' },
            },
          },
        },
      },
    })
    const result = FacilityConfigSchema.safeParse(data)
    expect(result.success).toBe(true)
  })
})
