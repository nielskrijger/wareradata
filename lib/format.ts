// Placeholder shown wherever a value is missing. DataTableRow detects this
// sentinel and renders it muted, so cells can keep returning the bare string.
export const EMPTY = '—'

/**
 * Formats an ISO timestamp as a short relative time ("3h ago", "2d ago",
 * "1mo ago", "2y ago") via Intl.RelativeTimeFormat in narrow style.
 */
const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto', style: 'narrow' })

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
