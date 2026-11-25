import { COLOR, seriesColor } from '@/components/colors'

/**
 * Shared formatting for the factory views (the income bar and the roster).
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
    return 'text-green'
  }

  if (value < 0) {
    return 'text-red'
  }

  return 'text-muted-foreground'
}

export function itemColors(codes: string[]): Map<string, string> {
  const unique = [...new Set(codes)]

  return new Map(unique.map((code, i) => [code, seriesColor(i)]))
}

/**
 * camelCase code → "Title case" label ("earlyBloomer" → "Early bloomer").
 */
export function humanizeCode(code: string): string {
  const s = humanizeItem(code)

  return s.charAt(0).toUpperCase() + s.slice(1)
}

export const ENGINE_FILL = COLOR.grey
export const STAFF_FILL = COLOR.green
