import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { Image } from '../image'
import { Section } from '../section'
import { resolveRadixColor } from '../../lib/resolve-color'

describe('Image', () => {
  it('renders <img> with alt text', () => {
    render(<Image src="/test.jpg" alt="Test image" />)
    const img = screen.getByAltText('Test image')
    expect(img).toBeInTheDocument()
    expect(img.tagName).toBe('IMG')
    expect(img).toHaveAttribute('src', '/test.jpg')
  })

  it('applies aspect-ratio when aspect prop is set', () => {
    render(<Image src="/test.jpg" alt="Aspect test" aspect="16/9" />)
    const img = screen.getByAltText('Aspect test')
    expect(img.style.aspectRatio).toBe('16/9')
  })

  it('uses lazy loading by default', () => {
    render(<Image src="/test.jpg" alt="Lazy test" />)
    const img = screen.getByAltText('Lazy test')
    expect(img).toHaveAttribute('loading', 'lazy')
  })

  it('uses eager loading when priority is true', () => {
    render(<Image src="/test.jpg" alt="Priority test" priority />)
    const img = screen.getByAltText('Priority test')
    expect(img).toHaveAttribute('loading', 'eager')
  })
})

describe('Section', () => {
  it('renders children', () => {
    render(<Section><p>Hello</p></Section>)
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })

  it('renders background image when background prop is set', () => {
    render(
      <Section background={{ src: '/bg.jpg', alt: 'Background' }}>
        <p>Content</p>
      </Section>
    )
    const img = document.querySelector('img')
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', '/bg.jpg')
    expect(screen.getByText('Content')).toBeInTheDocument()
  })

  it('renders overlay div when overlay prop is set', () => {
    render(
      <Section background={{ src: '/bg.jpg', alt: 'BG' }} overlay="dark">
        <p>Content</p>
      </Section>
    )
    const overlay = screen.getByTestId('overlay')
    expect(overlay).toBeInTheDocument()
    expect(overlay.style.backgroundColor).toBe('rgba(0, 0, 0, 0.6)')
  })

  it('renders light overlay', () => {
    render(
      <Section background={{ src: '/bg.jpg', alt: 'BG' }} overlay="light">
        <p>Content</p>
      </Section>
    )
    const overlay = screen.getByTestId('overlay')
    expect(overlay.style.backgroundColor).toBe('rgba(255, 255, 255, 0.4)')
  })
})

describe('resolveRadixColor', () => {
  it('maps known Radix colors through', () => {
    expect(resolveRadixColor('blue')).toBe('blue')
    expect(resolveRadixColor('red')).toBe('red')
    expect(resolveRadixColor('tomato')).toBe('tomato')
    expect(resolveRadixColor('grass')).toBe('grass')
  })

  it('maps oklch hue values to nearest Radix color', () => {
    expect(resolveRadixColor('oklch(0.5 0.2 10)')).toBe('red')
    expect(resolveRadixColor('oklch(0.5 0.2 45)')).toBe('orange')
    expect(resolveRadixColor('oklch(0.5 0.2 75)')).toBe('yellow')
    expect(resolveRadixColor('oklch(0.5 0.2 120)')).toBe('green')
    expect(resolveRadixColor('oklch(0.5 0.2 175)')).toBe('teal')
    expect(resolveRadixColor('oklch(0.5 0.2 230)')).toBe('blue')
    expect(resolveRadixColor('oklch(0.5 0.2 280)')).toBe('purple')
    expect(resolveRadixColor('oklch(0.5 0.2 320)')).toBe('pink')
    expect(resolveRadixColor('oklch(0.5 0.2 350)')).toBe('red')
  })

  it('falls back to blue for unknown values', () => {
    expect(resolveRadixColor('#ff0000')).toBe('blue')
    expect(resolveRadixColor('unknown')).toBe('blue')
  })
})
