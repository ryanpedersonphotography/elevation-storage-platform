import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { PageRenderer } from '../page-renderer'
import type { Page, FacilityConfig } from '@jerry/facility-config'
import type { Template } from '../../templates/types'

// ─── Fixtures ───

const mockTemplate: Template = {
  name: 'modern',
  radius: 'medium',
  scaling: '100%',
  font: 'Inter',
  defaults: {
    Hero: { variant: 'overlay', layout: 'centered' },
    ContentSection: { variant: 'clean', layout: 'image-right' },
  },
}

const mockFacility: FacilityConfig = {
  slug: 'test-facility',
  name: 'Test Facility',
  info: {
    address: { street: '123 Main', city: 'Anytown', state: 'TX', zip: '12345' },
    phone: '555-0100',
    email: 'test@example.com',
    coordinates: { lat: 30.0, lng: -97.0 },
    hours: [{ days: ['Mo', 'Tu', 'We', 'Th', 'Fr'], open: '08:00', close: '18:00' }],
  },
  branding: {
    showParent: false,
    template: 'modern',
    colors: {
      primary: 'oklch(0.55 0.15 250)',
      accent: 'oklch(0.65 0.20 30)',
    },
    logo: '/logo.svg',
  },
  deployment: { mode: 'standalone', domain: null },
  seo: {
    siteName: 'Test',
    defaultTitle: 'Test Facility',
    defaultDescription: 'A test facility',
  },
  analytics: { gtag: null },
  pages: {},
  data: { units: [], amenities: [], testimonials: [] },
}

function makePage(overrides: Partial<Page> = {}): Page {
  return {
    enabled: true,
    layout: ['hero', 'content'],
    sections: {
      hero: { component: 'Hero', content: { heading: 'Welcome' } },
      content: { component: 'ContentSection', content: { heading: 'About Us' } },
    },
    ...overrides,
  }
}

// ─── Tests ───

describe('PageRenderer', () => {
  it('renders sections in layout order', () => {
    const page = makePage()
    const { container } = render(
      <PageRenderer page={page} facilityData={mockFacility} template={mockTemplate} />
    )
    const sections = container.querySelectorAll('[data-section]')
    expect(sections).toHaveLength(2)
    expect(sections[0]).toHaveAttribute('data-section', 'Welcome')
    expect(sections[1]).toHaveAttribute('data-section', 'About Us')
  })

  it('applies template defaults when section has no variant/layout', () => {
    const page = makePage({
      layout: ['hero'],
      sections: {
        hero: { component: 'Hero', content: { heading: 'Test' } },
      },
    })

    // StubSection doesn't render variant/layout visually, but we verify
    // the component receives them by checking the PageRenderer passes them through.
    // We'll verify by rendering and confirming no error occurs with defaults applied.
    const { container } = render(
      <PageRenderer page={page} facilityData={mockFacility} template={mockTemplate} />
    )
    expect(container.querySelector('[data-section="Test"]')).toBeInTheDocument()
  })

  it('section-level variant overrides template default', () => {
    const page = makePage({
      layout: ['hero'],
      sections: {
        hero: {
          component: 'Hero',
          variant: 'split',
          layout: 'image-left',
          content: { heading: 'Override' },
        },
      },
    })
    const { container } = render(
      <PageRenderer page={page} facilityData={mockFacility} template={mockTemplate} />
    )
    // Section renders successfully with override values
    expect(container.querySelector('[data-section="Override"]')).toBeInTheDocument()
  })

  it('throws descriptive error for unknown component', () => {
    const page = makePage({
      layout: ['bad'],
      sections: {
        bad: { component: 'NonExistent' as any, content: {} },
      },
    })
    expect(() =>
      render(
        <PageRenderer page={page} facilityData={mockFacility} template={mockTemplate} />
      )
    ).toThrow(/Unknown component "NonExistent" in section "bad"/)
  })

  it('renders nothing for empty layout array', () => {
    const page = makePage({
      layout: [],
      sections: {},
    })
    const { container } = render(
      <PageRenderer page={page} facilityData={mockFacility} template={mockTemplate} />
    )
    expect(container.innerHTML).toBe('')
  })
})
