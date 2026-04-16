import type { Template } from './types'

export const modern: Template = {
  name: 'modern',
  radius: 'medium',
  scaling: '100%',
  font: 'Inter',
  defaults: {
    Hero: { variant: 'overlay', layout: 'centered' },
    ContentSection: { variant: 'clean', layout: 'image-right' },
    UnitGrid: { variant: 'cards', layout: '3-col' },
    FeatureGrid: { variant: 'icons', layout: '4-col' },
    CallToAction: { variant: 'gradient', layout: 'centered' },
  },
}
