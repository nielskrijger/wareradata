/**
 * Placeholder shown wherever a value is missing. DataTableRow detects this
 * sentinel and renders it muted, so cells can keep returning the bare string.
 */
export const EMPTY = '—'

/**
 * Reads the clock here so components calling it stay pure for the linter.
 */
export function isOlderThan(iso: string | null, ms: number): boolean {
  if (!iso) {
    return false
  }

  const then = Date.parse(iso)

  return !Number.isNaN(then) && Date.now() - then > ms
}

/**
 * Grouped number ("12,345"). Fixed to English so the server and browser
 * render the same text.
 */
export function formatNumber(n: number | null | undefined, maximumFractionDigits = 3): string {
  return n == null ? EMPTY : n.toLocaleString('en', { maximumFractionDigits })
}

/**
 * The calendar date of an ISO timestamp ("2025-03-14").
 */
export function formatDate(iso: string | null | undefined): string {
  return iso ? iso.slice(0, 10) : EMPTY
}

/**
 * Number with a fixed count of decimals ("12.3"), for scores like development.
 */
export function formatDecimal(n: number | null | undefined, digits = 1): string {
  return n == null ? EMPTY : n.toFixed(digits)
}

const compact = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 })

/**
 * Short plain-text number ("1.2K", "40M"), for labels where <CompactNumber>'s
 * aligned markup doesn't fit.
 */
export function formatCompact(n: number | null | undefined): string {
  return n == null ? EMPTY : compact.format(n)
}

const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto', style: 'narrow' })

/**
 * Formats an ISO timestamp as a short relative time ("3h ago", "2d ago",
 * "1mo ago", "2y ago") via Intl.RelativeTimeFormat in narrow style.
 */
export function formatRelativeTime(iso: string | null): string {
  if (!iso) {
    return EMPTY
  }

  const then = Date.parse(iso)
  if (Number.isNaN(then)) {
    return EMPTY
  }

  const seconds = Math.max(0, Math.floor((Date.now() - then) / 1000))
  if (seconds < 60) {
    return rtf.format(0, 'second')
  }

  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) {
    return rtf.format(-minutes, 'minute')
  }

  const hours = Math.floor(minutes / 60)
  if (hours < 48) {
    return rtf.format(-hours, 'hour')
  }

  const days = Math.floor(hours / 24)
  if (days < 30) {
    return rtf.format(-days, 'day')
  }

  const months = Math.floor(days / 30)
  if (months < 12) {
    return rtf.format(-months, 'month')
  }

  return rtf.format(-Math.floor(days / 365), 'year')
}

/**
 * Formats a future ISO timestamp as a compact countdown ("3h12m", "12m") for a
 * live "time remaining" label. Clamps to "0m" once the moment has passed.
 * Returns the empty placeholder for a null or unparseable input.
 */
export function formatCountdown(iso: string | null): string {
  if (!iso) {
    return EMPTY
  }

  const then = Date.parse(iso)
  if (Number.isNaN(then)) {
    return EMPTY
  }

  const totalMinutes = Math.max(0, Math.round((then - Date.now()) / 60_000))
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours > 0) {
    return `${hours}h${String(minutes).padStart(2, '0')}m`
  }

  return `${minutes}m`
}

/**
 * "top 9%", with a decimal under 1% so the very best don't all read "top 0%".
 */
export function topPercent(rank: number, total: number): string {
  const pct = (rank / total) * 100

  return pct < 1 ? `top ${pct.toFixed(1)}%` : `top ${Math.round(pct)}%`
}
