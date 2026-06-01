import type { GearLookup } from '@/lib/gear/score'
import type { Range } from '@/lib/query'
import type { UserRow } from '@/lib/rows'
import type { Equipment } from '@/lib/warera/api'

import { getSnapshot } from './memory'

import 'server-only'

export interface UserDetails {
  user: UserRow
  // Per-field [min, max, median] over the full user set, mirroring the shape
  // used by the data table's HeatCell so the hover-card can heat-tint values
  // against the same baseline.
  ranges: Record<string, Range>
  total: number
  // Currently-equipped gear from the latest scrape. Empty object when the
  // user stripped between battles (the scraper captured no slots) or when
  // the snapshot pre-dates the equipment scrape phase.
  equipment: Equipment
  // The small code→tier + ammo-bonus lookup, so the client hover-card's gear
  // strip can resolve tiers/bonuses without the full config (see Snapshot).
  gearLookup: GearLookup
}

/**
 * One user plus the leaderboard ranges needed to heat-tint their stats. Backs
 * the `/api/users/[id]` route (the username hover-card tooltip's data source).
 * Ranges are precomputed on the Snapshot, so this is O(n) on the find only.
 */
export async function getUserById(id: string): Promise<UserDetails | null> {
  const { users, userRanges, equipment, gearLookup } = await getSnapshot()
  const user = users.find(u => u.id === id)
  if (!user) {
    return null
  }
  return { user, ranges: userRanges, total: users.length, equipment: equipment[id] ?? {}, gearLookup }
}
