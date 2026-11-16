import { EMPTY } from '@/lib/format'

/**
 * The muted em-dash placeholder for a missing value. Data-table cells that
 * render null get it automatically.
 */
export function EmptyDash() {
  return <span className="text-muted-foreground">{EMPTY}</span>
}
