import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import type { FacilityConfig } from '@jerry/facility-config'
import type { SectionProps } from '../../renderer/registry'
import { Hero } from '../hero'
import { HeroSimple } from '../hero-simple'
import { ContentSection } from '../content-section'
import { UnitGrid } from '../unit-grid'
import { FeatureGrid } from '../feature-grid'
import { CallToAction } from '../call-to-action'
import { ContactForm } from '../contact-form'
import { TestimonialGrid } from '../testimonial-grid'
import { FAQ } from '../faq'

// Mock lucide-react
vi.mock('lucide-react', () => {
  const createMockIcon = (name: string) => {
    const Icon = (props: Record<string, unknown>) => (
      <svg data-testid={`icon-${name}`} {...props} />
    )
    Icon.displayName = name
    return Icon
  }
  return {
    Shield: createMockIcon('Shield'),
    Clock: createMockIcon('Clock'),
    Camera: createMockIcon('Camera'),
  }
})

// Mock useAnalytics
vi.mock('../../hooks/use-analytics', () => ({
  useAnalytics: () => ({ track: vi.fn() }),
}))

// Minimal mock facility data
const mockFacility: FacilityConfig = {
  slug: 'test-facility',
  name: 'Test Storage',
  info: {
    address: { street: '123 Main St', city: 'Testville', state: 'TX', zip: '75001' },
    phone: '555-0100',
    email: 'test@test.com',
    coordinates: { lat: 32.7767, lng: -96.797 },
    hours: [{ days: ['Mo', 'Tu', 'We', 'Th', 'Fr'], open: '08:00', close: '18:00' }],
  },
  branding: {
    showParent: false,
    template: 'modern',
    colors: { primary: 'oklch(0.55 0.15 250)', accent: 'oklch(0.65 0.20 30)' },
    logo: '/logo.svg',
  },
  deployment: { mode: 'standalone', domain: null },
  seo: {
    siteName: 'Test Storage',
    defaultTitle: 'Test Storage',
    defaultDescription: 'A test facility',
  },
  analytics: { gtag: null },
  pages: {},
  data: {
    units: [
      { id: 'sm', size: '5x5', sqft: 25, price: 49, features: ['Indoor'] },
      { id: 'md', size: '10x10', sqft: 100, price: 99, features: ['Climate', 'Indoor'] },
      { id: 'lg', size: '10x20', sqft: 200, price: 149, features: ['Drive-up'] },
    ],
    amenities: [
      { id: 'security', label: '24/7 Security', icon: 'Shield', description: 'Round the clock monitoring' },
      { id: 'access', label: 'Extended Access', icon: 'Clock', description: 'Access 6am to 10pm' },
    ],
    testimonials: [
      { name: 'Jane Doe', rating: 5, text: 'Great facility, very clean!' },
      { name: 'John Smith', rating: 4, text: 'Affordable and convenient.' },
      { name: 'Alice Johnson', rating: 5, text: 'Best storage in town.' },
    ],
  },
}

function makeSectionProps(content: Record<string, unknown>, overrides?: Partial<SectionProps>): SectionProps {
  return {
    content,
    facilityData: mockFacility,
    ...overrides,
  }
}

// ─── Hero ───
describe('Hero', () => {
  it('renders h1 heading', () => {
    const props = makeSectionProps({
      heading: 'Secure Storage Solutions',
      image: { src: '/hero.jpg', alt: 'Hero background' },
    })
    render(<Hero {...props} />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Secure Storage Solutions')
  })

  it('renders background image', () => {
    const props = makeSectionProps({
      heading: 'Test',
      image: { src: '/hero.jpg', alt: 'Hero bg' },
    })
    const { container } = render(<Hero {...props} />)
    const img = container.querySelector('img[src="/hero.jpg"]')
    expect(img).toBeInTheDocument()
  })

  it('renders subtitle when provided', () => {
    const props = makeSectionProps({
      heading: 'Test',
      subtitle: 'Find the perfect unit',
      image: { src: '/hero.jpg', alt: '' },
    })
    render(<Hero {...props} />)
    expect(screen.getByText('Find the perfect unit')).toBeInTheDocument()
  })

  it('renders CTA when provided', () => {
    const props = makeSectionProps({
      heading: 'Test',
      image: { src: '/hero.jpg', alt: '' },
      cta: { label: 'Reserve Now', href: '/reserve', variant: 'primary' },
    })
    render(<Hero {...props} />)
    expect(screen.getByText('Reserve Now')).toBeInTheDocument()
  })
})

// ─── HeroSimple ───
describe('HeroSimple', () => {
  it('renders h2 heading', () => {
    const props = makeSectionProps({ heading: 'Our Services' })
    render(<HeroSimple {...props} />)
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Our Services')
  })

  it('renders blurb when provided', () => {
    const props = makeSectionProps({ heading: 'About', blurb: 'Learn more about us' })
    render(<HeroSimple {...props} />)
    expect(screen.getByText('Learn more about us')).toBeInTheDocument()
  })
})

// ─── ContentSection ───
describe('ContentSection', () => {
  it('renders paragraphs', () => {
    const props = makeSectionProps({
      heading: 'About Us',
      paragraphs: ['First paragraph.', 'Second paragraph.'],
    })
    render(<ContentSection {...props} />)
    expect(screen.getByText('First paragraph.')).toBeInTheDocument()
    expect(screen.getByText('Second paragraph.')).toBeInTheDocument()
  })

  it('renders optional image via MediaBlock', () => {
    const props = makeSectionProps({
      heading: 'About',
      image: { src: '/about.jpg', alt: 'About image' },
    })
    render(<ContentSection {...props} />)
    expect(screen.getByAltText('About image')).toBeInTheDocument()
  })

  it('renders without image', () => {
    const props = makeSectionProps({ heading: 'Text Only' })
    render(<ContentSection {...props} />)
    expect(screen.getByText('Text Only')).toBeInTheDocument()
  })
})

// ─── UnitGrid ───
describe('UnitGrid', () => {
  it('shows all units when no filter', () => {
    const props = makeSectionProps({ heading: 'Units', showPricing: true })
    render(<UnitGrid {...props} />)
    expect(screen.getByText('5x5')).toBeInTheDocument()
    expect(screen.getByText('10x10')).toBeInTheDocument()
    expect(screen.getByText('10x20')).toBeInTheDocument()
  })

  it('filters units by ID', () => {
    const props = makeSectionProps({ heading: 'Units', filter: ['sm', 'lg'] })
    render(<UnitGrid {...props} />)
    expect(screen.getByText('5x5')).toBeInTheDocument()
    expect(screen.getByText('10x20')).toBeInTheDocument()
    expect(screen.queryByText('10x10')).not.toBeInTheDocument()
  })

  it('shows pricing by default', () => {
    const props = makeSectionProps({ heading: 'Units' })
    render(<UnitGrid {...props} />)
    expect(screen.getByText('$49')).toBeInTheDocument()
  })

  it('shows features when enabled', () => {
    const props = makeSectionProps({ heading: 'Units', showFeatures: true })
    render(<UnitGrid {...props} />)
    expect(screen.getAllByText('Indoor').length).toBeGreaterThanOrEqual(1)
  })
})

// ─── FeatureGrid ───
describe('FeatureGrid', () => {
  it('renders features from content', () => {
    const props = makeSectionProps({
      heading: 'Features',
      features: [
        { icon: 'Shield', heading: 'Secure', blurb: 'Locked gates' },
        { icon: 'Clock', heading: 'Open Late', blurb: 'Extended hours' },
      ],
    })
    render(<FeatureGrid {...props} />)
    expect(screen.getByText('Secure')).toBeInTheDocument()
    expect(screen.getByText('Open Late')).toBeInTheDocument()
  })

  it('falls back to facilityData amenities', () => {
    const props = makeSectionProps({ heading: 'Amenities' })
    render(<FeatureGrid {...props} />)
    expect(screen.getByText('24/7 Security')).toBeInTheDocument()
    expect(screen.getByText('Extended Access')).toBeInTheDocument()
  })
})

// ─── CallToAction ───
describe('CallToAction', () => {
  it('renders CTAGroup with primary CTA', () => {
    const props = makeSectionProps({
      heading: 'Get Started',
      cta: { label: 'Reserve', href: '/reserve', variant: 'primary' },
    })
    render(<CallToAction {...props} />)
    expect(screen.getByText('Reserve')).toBeInTheDocument()
    expect(screen.getByText('Reserve').closest('a')).toHaveAttribute('href', '/reserve')
  })

  it('renders optional secondary CTA', () => {
    const props = makeSectionProps({
      heading: 'Get Started',
      cta: { label: 'Reserve', href: '/reserve', variant: 'primary' },
      ctaSecondary: { label: 'Learn More', href: '/about', variant: 'secondary' },
    })
    render(<CallToAction {...props} />)
    expect(screen.getByText('Reserve')).toBeInTheDocument()
    expect(screen.getByText('Learn More')).toBeInTheDocument()
  })
})

// ─── ContactForm ───
describe('ContactForm', () => {
  it('renders form fields from content.fields array', () => {
    const props = makeSectionProps({
      heading: 'Contact Us',
      fields: ['name', 'email', 'message'],
      submitLabel: 'Send',
      successMessage: 'Thank you!',
    })
    render(<ContactForm {...props} />)
    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.getByText('Email')).toBeInTheDocument()
    expect(screen.getByText('Message')).toBeInTheDocument()
    expect(screen.getByText('Send')).toBeInTheDocument()
  })

  it('shows success message after submit', () => {
    const props = makeSectionProps({
      heading: 'Reserve',
      fields: ['name'],
      submitLabel: 'Submit',
      successMessage: 'We will contact you soon!',
    })
    render(<ContactForm {...props} />)
    fireEvent.submit(screen.getByText('Submit').closest('form')!)
    expect(screen.getByTestId('success-message')).toHaveTextContent('We will contact you soon!')
  })
})

// ─── TestimonialGrid ───
describe('TestimonialGrid', () => {
  it('renders testimonials from facilityData', () => {
    const props = makeSectionProps({ heading: 'Reviews' })
    render(<TestimonialGrid {...props} />)
    expect(screen.getByText('Jane Doe')).toBeInTheDocument()
    expect(screen.getByText('John Smith')).toBeInTheDocument()
    expect(screen.getByText('Alice Johnson')).toBeInTheDocument()
  })

  it('limits testimonials when content.limit set', () => {
    const props = makeSectionProps({ heading: 'Reviews', limit: 2 })
    render(<TestimonialGrid {...props} />)
    expect(screen.getByText('Jane Doe')).toBeInTheDocument()
    expect(screen.getByText('John Smith')).toBeInTheDocument()
    expect(screen.queryByText('Alice Johnson')).not.toBeInTheDocument()
  })

  it('renders star ratings', () => {
    const props = makeSectionProps({ heading: 'Reviews', limit: 1 })
    render(<TestimonialGrid {...props} />)
    // Jane Doe has 5 stars
    expect(screen.getByText('★★★★★')).toBeInTheDocument()
  })
})

// ─── FAQ ───
describe('FAQ', () => {
  it('renders heading', () => {
    const props = makeSectionProps({
      heading: 'Frequently Asked Questions',
      items: [
        { question: 'Do you have 24-hour access?', answer: 'Yes, all tenants get a personal access code.' },
      ],
    })
    render(<FAQ {...props} />)
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Frequently Asked Questions')
  })

  it('renders all questions', () => {
    const props = makeSectionProps({
      heading: 'FAQ',
      items: [
        { question: 'Question one?', answer: 'Answer one.' },
        { question: 'Question two?', answer: 'Answer two.' },
      ],
    })
    render(<FAQ {...props} />)
    expect(screen.getByText('Question one?')).toBeInTheDocument()
    expect(screen.getByText('Question two?')).toBeInTheDocument()
  })

  it('toggles answer visibility on click (accordion variant)', () => {
    const props = makeSectionProps({
      heading: 'FAQ',
      items: [
        { question: 'How big are units?', answer: 'We offer 5x5 to 10x30.' },
      ],
    }, { variant: 'accordion' })
    render(<FAQ {...props} />)
    const trigger = screen.getByText('How big are units?')
    fireEvent.click(trigger)
    expect(screen.getByText('We offer 5x5 to 10x30.')).toBeVisible()
  })

  it('shows all answers in list variant', () => {
    const props = makeSectionProps({
      heading: 'FAQ',
      items: [
        { question: 'Q1?', answer: 'A1.' },
        { question: 'Q2?', answer: 'A2.' },
      ],
    }, { variant: 'list' })
    render(<FAQ {...props} />)
    expect(screen.getByText('A1.')).toBeVisible()
    expect(screen.getByText('A2.')).toBeVisible()
  })

  it('falls back to facilityData.data.faq when no items in content', () => {
    const facilityWithFaq = {
      ...mockFacility,
      data: {
        ...mockFacility.data,
        faq: [
          { question: 'From facility data?', answer: 'Yes it is.' },
        ],
      },
    }
    const props: SectionProps = {
      content: { heading: 'FAQ' },
      facilityData: facilityWithFaq as FacilityConfig,
    }
    render(<FAQ {...props} />)
    expect(screen.getByText('From facility data?')).toBeInTheDocument()
  })
})
