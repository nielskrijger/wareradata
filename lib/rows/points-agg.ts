import type { UserRow } from '@/lib/rows'

export interface PointsAgg {
  buffCount: number
  count: number
  damage: number
  debuffCount: number
  gemsPurchasedTotal: number
  healthCount: number
  healthSum: number
  hungerCount: number
  hungerSum: number
  level: number
  readyCount: number
  levelCount: number
  levelSum: number // Tracked seperately from count because not every user has a level value
  premiumGiftsTotal: number
  premiumMonthsTotal: number
  total: number
  wealth: number
}

function emptyAgg(): PointsAgg {
  return {
    buffCount: 0,
    count: 0,
    damage: 0,
    debuffCount: 0,
    gemsPurchasedTotal: 0,
    healthCount: 0,
    healthSum: 0,
    hungerCount: 0,
    hungerSum: 0,
    level: 0,
    levelCount: 0,
    levelSum: 0,
    premiumGiftsTotal: 0,
    premiumMonthsTotal: 0,
    readyCount: 0,
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
    entry.gemsPurchasedTotal += u.gemsPurchased ?? 0
    entry.premiumMonthsTotal += u.premiumMonths ?? 0
    entry.premiumGiftsTotal += u.premiumGifts ?? 0
    if (u.level !== null) {
      entry.levelSum += u.level
      entry.levelCount += 1
    }
    if (u.healthPercent !== null) {
      entry.healthSum += u.healthPercent
      entry.healthCount += 1
    }
    if (u.hungerPercent !== null) {
      entry.hungerSum += u.hungerPercent
      entry.hungerCount += 1
    }
    if (u.combatStatus === 'buff') {
      entry.buffCount += 1
    } else if (u.combatStatus === 'debuff') {
      entry.debuffCount += 1
    } else if (u.combatStatus === 'neither') {
      entry.readyCount += 1
    }
    out.set(key, entry)
  }

  return out
}

/**
 * Rounded mean of a sum/count pair from a {@link PointsAgg}, or null when the
 * count is zero. Used to derive average health/hunger (and similar) percentages
 * across an entity's members without re-walking the user list.
 */
export function aggMean(sum: number, count: number): number | null {
  return count > 0 ? Math.round(sum / count) : null
}

/**
 * Combat-status mix (buff / ready / debuff member counts) from a
 * {@link PointsAgg}, or all-zero when the agg is missing. Feeds the
 * CombatMixBar on country / MU rows.
 */
export function aggCombatMix(agg: PointsAgg | undefined): { buff: number, ready: number, debuff: number } {
  return {
    buff: agg?.buffCount ?? 0,
    ready: agg?.readyCount ?? 0,
    debuff: agg?.debuffCount ?? 0,
  }
}
