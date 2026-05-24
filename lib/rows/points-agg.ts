import type { UserRow } from '@/lib/rows'

export interface PointsAgg {
  count: number
  damage: number
  gemsPurchasedTotal: number
  level: number
  levelCount: number
  levelSum: number // Tracked seperately from count because not every user has a level value
  premiumGiftsTotal: number
  premiumMonthsTotal: number
  total: number
  wealth: number
}

function emptyAgg(): PointsAgg {
  return {
    count: 0,
    damage: 0,
    gemsPurchasedTotal: 0,
    level: 0,
    levelCount: 0,
    levelSum: 0,
    premiumGiftsTotal: 0,
    premiumMonthsTotal: 0,
    total: 0,
    wealth: 0,
  }
}

/**
 * Aggregate per-user stats into buckets keyed by `keyFor(user)`. Users for
 * which `keyFor` returns null are skipped — used by MU aggregation to
 * ignore unassigned users.
 *
 * Aggregates kept in one helper so callers do a single pass: points sums
 * (level / damage / wealth / total), member count, premium spend totals
 * (gems / months / gifts), and a level sum + count for avg-level derivation.
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
    entry.gemsPurchasedTotal += u.gemsPurchasedValue ?? 0
    entry.premiumMonthsTotal += u.premiumMonthsValue ?? 0
    entry.premiumGiftsTotal += u.premiumGiftsValue ?? 0
    if (u.level !== null) {
      entry.levelSum += u.level
      entry.levelCount += 1
    }
    out.set(key, entry)
  }

  return out
}
