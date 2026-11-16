/**
 * Shared formatting for the factory views (the stats card and the table).
 */

/**
 * camelCase item code → readable label ("cookedFish" → "cooked fish").
 */
export function humanizeItem(code: string): string {
  return code.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase()
}

/**
 * Signed gold for deltas: "+50.0 g", "−12.3 g", "0.0 g". One decimal by default —
 * per-employee/day figures are small (often near zero), so coarser rounding both
 * hides the value and stops the ledger's breakdown lines from summing to the net.
 */
export function goldSigned(value: number, decimals = 1): string {
  const factor = 10 ** decimals
  const rounded = Math.round(value * factor) / factor
  const sign = rounded > 0 ? '+' : rounded < 0 ? '−' : ''

  return `${sign}${Math.abs(rounded).toLocaleString('en', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })} g`
}

/**
 * Profit colour: green for gains, red for losses, muted for zero/idle.
 */
export function netClass(value: number): string {
  if (value > 0) {
    return 'text-green-700 dark:text-green-400'
  }

  if (value < 0) {
    return 'text-red-700 dark:text-red-400'
  }

  return 'text-muted-foreground'
}

/**
 * Hues for the value map, assigned in the order a user's items first appear.
 */
const ITEM_PALETTE = [
  'var(--color-sky-500)',
  'var(--color-orange-500)',
  'var(--color-amber-400)',
  'var(--color-stone-400)',
  'var(--color-violet-500)',
  'var(--color-emerald-500)',
  'var(--color-pink-500)',
  'var(--color-lime-500)',
]

export function itemColors(codes: string[]): Map<string, string> {
  const unique = [...new Set(codes)]

  return new Map(unique.map((code, i) => [code, ITEM_PALETTE[i % ITEM_PALETTE.length]]))
}

/**
 * camelCase code → "Title case" label ("earlyBloomer" → "Early bloomer").
 */
export function humanizeCode(code: string): string {
  const s = humanizeItem(code)

  return s.charAt(0).toUpperCase() + s.slice(1)
}
