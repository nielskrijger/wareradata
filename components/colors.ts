import type { Category } from '@/components/data-table/column-categories'

/**
 * The palette from globals.css, for inline styles and colour lists.
 */
export const COLOR = {
  red: 'var(--red)',
  orange: 'var(--orange)',
  gold: 'var(--gold)',
  green: 'var(--green)',
  teal: 'var(--teal)',
  blue: 'var(--blue)',
  purple: 'var(--purple)',
  grey: 'var(--grey)',
} as const

/**
 * War reads red and eco green everywhere a lean is drawn.
 */
export const WAR_COLOR = COLOR.red
export const ECO_COLOR = COLOR.green

/**
 * Hue per category, shared by table tabs, headers and the detail pages' rank maps.
 *
 * General stays colorless: a glyph on every general header would be noise.
 * Government and MU-specific share grey because they never appear in the same table.
 */
export const CATEGORY_COLOR = {
  points: COLOR.teal,
  combat: WAR_COLOR,
  government: COLOR.grey,
  muSpecific: COLOR.grey,
  wealth: COLOR.gold,
  factories: COLOR.orange,
  employees: COLOR.blue,
  premium: COLOR.purple,
  cases: COLOR.green,
} satisfies Partial<Record<Category, string>>

/**
 * Gear and case rarity, common to mythic.
 */
export const RARITY_COLOR = [COLOR.grey, COLOR.green, COLOR.blue, COLOR.purple, COLOR.gold, COLOR.red] as const

/**
 * Hues for series with no meaning of their own (items, parties), most separable
 * first. Grey stays out: it marks "none" (independents, the factory engine).
 */
const SERIES_COLORS = [
  COLOR.blue,
  COLOR.red,
  COLOR.green,
  COLOR.gold,
  COLOR.purple,
  COLOR.teal,
  COLOR.orange,
] as const

/**
 * The `i`th series hue, cycling when there are more series than hues.
 */
export function seriesColor(i: number): string {
  return SERIES_COLORS[i % SERIES_COLORS.length]
}

/**
 * `color` at `percent` opacity, for tinted fills and rings.
 */
export function tint(color: string, percent: number): string {
  return `color-mix(in oklab, ${color} ${percent}%, transparent)`
}
