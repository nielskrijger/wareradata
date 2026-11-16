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
 * Distinct hues for the value map; items not listed fall back to a hash so a
 * new item still gets a stable colour.
 */
const ITEM_COLORS: Record<string, string> = {
  lead: 'var(--color-sky-500)',
  iron: 'var(--color-orange-500)',
  oil: 'var(--color-stone-400)',
  lightAmmo: 'var(--color-amber-400)',
  ammo: 'var(--color-amber-600)',
  heavyAmmo: 'var(--color-yellow-700)',
  steel: 'var(--color-slate-400)',
  grain: 'var(--color-lime-500)',
  bread: 'var(--color-yellow-500)',
  fish: 'var(--color-cyan-500)',
  cookedFish: 'var(--color-teal-500)',
  livestock: 'var(--color-rose-400)',
  steak: 'var(--color-red-500)',
  limestone: 'var(--color-zinc-300)',
  concrete: 'var(--color-zinc-500)',
  petroleum: 'var(--color-violet-500)',
  coca: 'var(--color-emerald-500)',
  cocain: 'var(--color-fuchsia-500)',
  wood: 'var(--color-amber-700)',
  paper: 'var(--color-indigo-400)',
}

const FALLBACK_COLORS = [
  'var(--color-pink-500)',
  'var(--color-green-500)',
  'var(--color-blue-500)',
  'var(--color-purple-500)',
]

export function itemColor(code: string): string {
  if (ITEM_COLORS[code]) {
    return ITEM_COLORS[code]
  }

  let h = 0
  for (const ch of code) {
    h = (h * 31 + ch.charCodeAt(0)) >>> 0
  }

  return FALLBACK_COLORS[h % FALLBACK_COLORS.length]
}

/**
 * camelCase code → "Title case" label ("earlyBloomer" → "Early bloomer").
 */
export function humanizeCode(code: string): string {
  const s = humanizeItem(code)

  return s.charAt(0).toUpperCase() + s.slice(1)
}
