import type { Template } from './types'

export const trojan: Template = {
  name: 'trojan',
  radius: 'full',
  scaling: '100%',
  font: 'Inter',
  defaults: {
    Hero: { variant: 'overlay', layout: 'centered' },
    HeroSimple: { variant: 'colored' },
    ContentSection: { variant: 'clean', layout: 'image-right' },
    UnitGrid: { variant: 'cards', layout: '3-col' },
    FeatureGrid: { variant: 'icons', layout: '4-col' },
    CallToAction: { variant: 'solid', layout: 'centered' },
    TestimonialGrid: { variant: 'featured' },
    FAQ: { variant: 'accordion' },
    FacilityDirectory: { variant: 'cards', layout: '3-col' },
  },
}
