export type ThemeId =
  | 'light'
  | 'dark'
  | 'system'
  | 'signal'
  | 'nectar'
  | 'heirloom'
  | 'afterhours'
  | 'phosphor'
  | 'cypress'

export type Palette = {
  id: Exclude<ThemeId, 'system'>
  name: string
  /** The color the canvas is painted in. */
  base: string
  /** The color the navigation rail and primary actions are painted in. */
  accent: string
  bias: 'light' | 'dark'
}

/**
 * The six palettes Jaiden specified, plus kovo's own light and dark.
 * Each is exactly two colors -- every other surface, line and text tone is
 * derived from them in CSS, so these two values stay exact.
 *
 * `bias` says which of the two is the canvas: a light-bias palette paints the
 * page in its lighter color and the rail in its darker/more saturated one.
 */
export const PALETTES: Palette[] = [
  { id: 'signal', name: 'Signal', base: '#F8F7F4', accent: '#0057FF', bias: 'light' },
  { id: 'nectar', name: 'Nectar', base: '#FFD6A5', accent: '#6A00F4', bias: 'light' },
  { id: 'heirloom', name: 'Heirloom', base: '#F8E7C9', accent: '#064E3B', bias: 'light' },
  { id: 'afterhours', name: 'Afterhours', base: '#1E1033', accent: '#FF4696', bias: 'dark' },
  { id: 'phosphor', name: 'Phosphor', base: '#050505', accent: '#D7FFE0', bias: 'dark' },
  { id: 'cypress', name: 'Cypress', base: '#152D35', accent: '#D4ECDD', bias: 'dark' },
]

export const BASE_MODES = [
  { id: 'light' as const, name: 'Light' },
  { id: 'dark' as const, name: 'Dark' },
  { id: 'system' as const, name: 'System' },
]

const PALETTE_IDS = new Set<string>(PALETTES.map((p) => p.id))

export function isPalette(theme: string): boolean {
  return PALETTE_IDS.has(theme)
}

/**
 * Steps of a single-hue ramp off the palette accent, used for category slices.
 * It stops well short of the canvas so the faintest step stays legible on a
 * dark base; adjacent slices are told apart by the gap between them and by the
 * always-present legend, never by hue alone.
 */
export function rampStep(index: number, count: number): string {
  const span = Math.min(48, count * 9.5)
  const pct = count <= 1 ? 100 : 100 - (index / (count - 1)) * span
  return `color-mix(in oklab, var(--accent) ${pct.toFixed(1)}%, var(--canvas))`
}
