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
