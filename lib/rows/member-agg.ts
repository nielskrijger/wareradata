import type { UserRow } from '@/lib/rows'

export interface MemberAgg {
  buffCount: number
  count: number
  damage: number
  debuffCount: number
  gearScoreCount: number
  gearScoreSum: number
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
  // Sum and count of members' warShare (war / war+eco). Counts only members
  // with a non-null share (i.e. who've trained war or eco), so the mean is a
  // one-member-one-vote average of leans, untrained members excluded — same
  // null-handling as the gear/health/hunger means.
  warShareSum: number
  warShareCount: number
  // Sum of members' point-scored wealth (feeds each entity's wealthPoints and
  // the points total). Equal to `wealth` today because WEALTH_DIVISOR is 1
  // gold/point.
  wealthPoints: number
  // Sum of members' actual wealth in gold, mirroring UserRow.wealth. Tracked
  // apart from wealthPoints so the Member/Citizen Wealth column reflects real
  // holdings rather than the points derivative, which would diverge if the
  // scoring divisor ever changed.
  wealth: number
  // Sums of members' five wealth parts (UserRow.{companies,items,cash,equipment,
  // weapons}Wealth), for the entity's "Wealth composition" breakdown. Members
  // missing a breakdown contribute 0.
  companiesWealth: number
  itemsWealth: number
  cashWealth: number
  equipmentWealth: number
  weaponsWealth: number
  // Sum + count of members' points/day, for the per-member average rate. Counts
  // only members with a non-null rate (accounts <7 days old have none).
  pointsPerDaySum: number
  pointsPerDayCount: number
}

function emptyAgg(): MemberAgg {
  return {
    buffCount: 0,
    count: 0,
    damage: 0,
    debuffCount: 0,
    gearScoreCount: 0,
    gearScoreSum: 0,
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
    warShareSum: 0,
    warShareCount: 0,
    wealthPoints: 0,
    wealth: 0,
    companiesWealth: 0,
    itemsWealth: 0,
    cashWealth: 0,
    equipmentWealth: 0,
    weaponsWealth: 0,
    pointsPerDaySum: 0,
    pointsPerDayCount: 0,
  }
}

/**
 * Aggregate per-user stats into buckets keyed by `keyFor(user)`. Users for
 * which `keyFor` returns null are skipped — used by MU aggregation to
 * ignore unassigned users.
 *
 * Aggregates kept in one helper so callers do a single pass: points sums
 * (level / damage / wealthPoints / total), raw member wealth (wealth),
 * member count, premium spend totals (gems / months / gifts),
 * level / health / hunger / gear sums + counts for averages, and
 * buff / ready / debuff counts for the readiness pill.
 */
export function aggregateMembers(
  userRows: UserRow[],
  keyFor: (u: UserRow) => string | null,
): Map<string, MemberAgg> {
  const out = new Map<string, MemberAgg>()
  for (const u of userRows) {
    const key = keyFor(u)
    if (!key) {
      continue
    }

    const entry = out.get(key) ?? emptyAgg()
    entry.total += u.points
    entry.level += u.levelPoints
    entry.damage += u.damagePoints
    entry.wealthPoints += u.wealthPoints
    entry.wealth += u.wealth ?? 0
    entry.companiesWealth += u.companiesWealth ?? 0
    entry.itemsWealth += u.itemsWealth ?? 0
    entry.cashWealth += u.cashWealth ?? 0
    entry.equipmentWealth += u.equipmentWealth ?? 0
    entry.weaponsWealth += u.weaponsWealth ?? 0
    entry.count += 1
    entry.gemsPurchasedTotal += u.gemsPurchased ?? 0
    entry.premiumMonthsTotal += u.premiumMonths ?? 0
    entry.premiumGiftsTotal += u.premiumGifts ?? 0
    if (u.level !== null) {
      entry.levelSum += u.level
      entry.levelCount += 1
    }
    if (u.pointsPerDay !== null) {
      entry.pointsPerDaySum += u.pointsPerDay
      entry.pointsPerDayCount += 1
    }
    if (u.healthPercent !== null) {
      entry.healthSum += u.healthPercent
      entry.healthCount += 1
    }
    if (u.hungerPercent !== null) {
      entry.hungerSum += u.hungerPercent
      entry.hungerCount += 1
    }
    if (u.gearScore !== null) {
      entry.gearScoreSum += u.gearScore
      entry.gearScoreCount += 1
    }
    if (u.warShare !== null) {
      entry.warShareSum += u.warShare
      entry.warShareCount += 1
    }
    if (u.readinessStatus === 'buff') {
      entry.buffCount += 1
    } else if (u.readinessStatus === 'debuff') {
      entry.debuffCount += 1
    } else if (u.readinessStatus === 'neither') {
      entry.readyCount += 1
    }
    out.set(key, entry)
  }

  return out
}

/**
 * Rounded mean of a sum/count pair from a {@link MemberAgg}, or null when the
 * count is zero. Used to derive average health/hunger (and similar) percentages
 * across an entity's members without re-walking the user list.
 */
export function aggMean(sum: number, count: number): number | null {
  return count > 0 ? Math.round(sum / count) : null
}

/**
 * Unrounded mean of a sum/count pair, or null when the count is zero. Used for
 * the war-share average, which lives in 0..1 where rounding would collapse the
 * signal — kept separate from {@link aggMean} (which rounds to whole percents).
 */
export function aggMeanRaw(sum: number, count: number): number | null {
  return count > 0 ? sum / count : null
}

/**
 * Readiness-status mix (buff / ready / debuff member counts) from a
 * {@link MemberAgg}, or all-zero when the agg is missing. Feeds the
 * ReadinessPillBar on country / MU rows.
 */
export function aggReadinessPill(agg: MemberAgg | undefined): { buff: number, ready: number, debuff: number } {
  return {
    buff: agg?.buffCount ?? 0,
    ready: agg?.readyCount ?? 0,
    debuff: agg?.debuffCount ?? 0,
  }
}
