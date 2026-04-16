export interface Template {
  name: string
  radius: 'none' | 'small' | 'medium' | 'large' | 'full'
  scaling: '90%' | '95%' | '100%' | '105%' | '110%'
  font: string
  defaults: Record<string, { variant?: string; layout?: string }>
}
