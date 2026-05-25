import { EMPTY } from '@/lib/format'

/**
 * The muted em-dash placeholder for a missing value, used outside the data
 * tables (inside them, DataTableRow mutes the bare EMPTY sentinel centrally).
 */
export function EmptyDash() {
  return <span className="text-muted-foreground">{EMPTY}</span>
}
