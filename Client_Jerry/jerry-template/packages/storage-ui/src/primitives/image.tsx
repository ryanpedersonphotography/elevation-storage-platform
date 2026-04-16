import React from 'react'

export interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string
  alt: string
  aspect?: '16/9' | '4/3' | '1/1' | '3/1'
  priority?: boolean
  className?: string
}

export function Image({ src, alt, aspect, priority, className, style, ...rest }: ImageProps) {
  return (
    <img
      src={src}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      className={className}
      style={{
        width: '100%',
        height: 'auto',
        objectFit: 'cover',
        ...(aspect ? { aspectRatio: aspect } : {}),
        ...style,
      }}
      {...rest}
    />
  )
}
