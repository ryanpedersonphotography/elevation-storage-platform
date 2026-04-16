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
    // Map hue ranges to Radix colors (full palette)
    if (hue >= 0 && hue < 15) return 'tomato'
    if (hue >= 15 && hue < 25) return 'red'
    if (hue >= 25 && hue < 35) return 'ruby'
    if (hue >= 35 && hue < 50) return 'orange'
    if (hue >= 50 && hue < 65) return 'amber'
    if (hue >= 65 && hue < 80) return 'yellow'
    if (hue >= 80 && hue < 100) return 'lime'
    if (hue >= 100 && hue < 130) return 'grass'
    if (hue >= 130 && hue < 155) return 'green'
    if (hue >= 155 && hue < 170) return 'jade'
    if (hue >= 170 && hue < 185) return 'teal'
    if (hue >= 185 && hue < 195) return 'cyan'
    if (hue >= 195 && hue < 210) return 'sky'
    if (hue >= 210 && hue < 240) return 'blue'
    if (hue >= 240 && hue < 255) return 'indigo'
    if (hue >= 255 && hue < 270) return 'iris'
    if (hue >= 270 && hue < 285) return 'violet'
    if (hue >= 285 && hue < 300) return 'purple'
    if (hue >= 300 && hue < 315) return 'plum'
    if (hue >= 315 && hue < 330) return 'pink'
    if (hue >= 330 && hue < 345) return 'crimson'
    if (hue >= 345) return 'red'
  }
  return 'blue' // fallback
}
