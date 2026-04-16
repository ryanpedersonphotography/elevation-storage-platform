const radixColors = [
  'tomato', 'red', 'ruby', 'crimson', 'pink', 'plum', 'purple', 'violet',
  'iris', 'indigo', 'blue', 'cyan', 'teal', 'jade', 'green', 'grass',
  'bronze', 'gold', 'brown', 'orange', 'amber', 'yellow', 'lime', 'mint', 'sky',
] as const

export type RadixColor = typeof radixColors[number]

export function resolveRadixColor(color: string): RadixColor {
  if (radixColors.includes(color as RadixColor)) return color as RadixColor
  // For oklch values, map hue to nearest Radix color
  const match = color.match(/oklch\(\s*[\d.]+\s+[\d.]+\s+([\d.]+)\s*\)/)
  if (match) {
    const hue = parseFloat(match[1])
    // Map hue ranges to Radix colors
    if (hue >= 0 && hue < 30) return 'red'
    if (hue >= 30 && hue < 60) return 'orange'
    if (hue >= 60 && hue < 90) return 'yellow'
    if (hue >= 90 && hue < 150) return 'green'
    if (hue >= 150 && hue < 200) return 'teal'
    if (hue >= 200 && hue < 260) return 'blue'
    if (hue >= 260 && hue < 300) return 'purple'
    if (hue >= 300 && hue < 340) return 'pink'
    if (hue >= 340) return 'red'
  }
  return 'blue' // fallback
}
