import React from 'react'

export interface SectionProps {
  background?: { src: string; alt: string }
  overlay?: 'dark' | 'light'
  children: React.ReactNode
  className?: string
}

export function Section({ background, overlay, children, className }: SectionProps) {
  if (!background) {
    return (
      <section
        className={className}
        style={{ paddingTop: '4rem', paddingBottom: '4rem' }}
      >
        {children}
      </section>
    )
  }

  return (
    <section
      className={className}
      style={{ position: 'relative', overflow: 'hidden' }}
    >
      <img
        src={background.src}
        alt={background.alt}
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
      />
      {overlay && (
        <div
          data-testid="overlay"
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor:
              overlay === 'dark'
                ? 'rgba(0, 0, 0, 0.6)'
                : 'rgba(255, 255, 255, 0.4)',
          }}
        />
      )}
      <div style={{ position: 'relative', zIndex: 10, paddingTop: '4rem', paddingBottom: '4rem' }}>
        {children}
      </div>
    </section>
  )
}
