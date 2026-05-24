import type { UserRow } from '@/lib/rows'

export interface PointsAgg {
  total: number
  level: number
  damage: number
  wealth: number
  count: number
}

function emptyAgg(): PointsAgg {
  return { total: 0, level: 0, damage: 0, wealth: 0, count: 0 }
}

/**
 * Sum each user's points into buckets keyed by `keyFor(user)`. Users for
 * which `keyFor` returns null are skipped — used by MU aggregation to
 * ignore unassigned users.
 */
export function aggregatePoints(
  userRows: UserRow[],
  keyFor: (u: UserRow) => string | null,
): Map<string, PointsAgg> {
  const out = new Map<string, PointsAgg>()
  for (const u of userRows) {
    const key = keyFor(u)
    if (!key) {
      continue
    }
    const entry = out.get(key) ?? emptyAgg()
    entry.total += u.points
    entry.level += u.levelPoints
    entry.damage += u.damagePoints
    entry.wealth += u.wealthPoints
    entry.count += 1
    out.set(key, entry)
  }
  return out
}
