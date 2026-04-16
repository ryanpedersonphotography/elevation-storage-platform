import type { Template } from './types'

export const friendly: Template = {
  name: 'friendly',
  radius: 'large',
  scaling: '100%',
  font: 'DM Sans',
  defaults: {
    Hero: { variant: 'wave', layout: 'centered' },
    ContentSection: { variant: 'soft', layout: 'stacked' },
    UnitGrid: { variant: 'cards', layout: '2-col' },
    FeatureGrid: { variant: 'pills', layout: '3-col' },
    CallToAction: { variant: 'rounded', layout: 'centered' },
  },
}
