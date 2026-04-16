import type { Template } from './types'

export const bold: Template = {
  name: 'bold',
  radius: 'none',
  scaling: '105%',
  font: 'Space Grotesk',
  defaults: {
    Hero: { variant: 'split', layout: 'image-left' },
    ContentSection: { variant: 'bordered', layout: 'image-left' },
    UnitGrid: { variant: 'table', layout: 'full-width' },
    FeatureGrid: { variant: 'cards', layout: '3-col' },
    CallToAction: { variant: 'solid', layout: 'left-aligned' },
  },
}
