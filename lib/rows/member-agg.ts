import type { GroupCaseStats, GroupFactoryStats, GroupPointsStats, GroupPremiumStats, GroupVitals, GroupWealthParts, UserRow } from '@/lib/rows'

import { luckPercent } from '@/lib/cases'

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
  // Sums of members' per-user factory totals (production points/day, net gold/day,
  // and Top-potential gold/day), for the entity's Factories columns. Members with
  // no scraped factories contribute 0; efficiency = factoryNet / factoryTop.
  factoryPpPerDay: number
  factoryNetPerDay: number
  factoryTopPotential: number
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
  // Case pulls: total opens, per-rarity sums, and the pooled luck score inputs
  // (see lib/cases.ts), so group luck judges the group's combined pulls against
  // the official odds rather than averaging member percentages.
  casesOpened: number
  standardCasesOpened: number
  mythicCasesOpened: number
  casesCommon: number
  casesUncommon: number
  casesRare: number
  casesEpic: number
  casesLegendary: number
  casesMythic: number
  caseLuckActual: number
  caseLuckExpected: number
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
    factoryPpPerDay: 0,
    factoryNetPerDay: 0,
    factoryTopPotential: 0,
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
    casesOpened: 0,
    standardCasesOpened: 0,
    mythicCasesOpened: 0,
    casesCommon: 0,
    casesUncommon: 0,
    casesRare: 0,
    casesEpic: 0,
    casesLegendary: 0,
    casesMythic: 0,
    caseLuckActual: 0,
    caseLuckExpected: 0,
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
    entry.casesOpened += u.casesOpened ?? 0
    entry.standardCasesOpened += u.standardCasesOpened ?? 0
    entry.mythicCasesOpened += u.mythicCasesOpened ?? 0
    entry.casesCommon += u.casesCommon ?? 0
    entry.casesUncommon += u.casesUncommon ?? 0
    entry.casesRare += u.casesRare ?? 0
    entry.casesEpic += u.casesEpic ?? 0
    entry.casesLegendary += u.casesLegendary ?? 0
    entry.casesMythic += u.casesMythic ?? 0
    entry.caseLuckActual += u.caseLuckActual
    entry.caseLuckExpected += u.caseLuckExpected
    entry.factoryPpPerDay += u.factoryPpPerDay ?? 0
    entry.factoryNetPerDay += u.factoryNetPerDay ?? 0
    entry.factoryTopPotential += u.factoryTopPotential ?? 0
    if (u.level !== null) {
      entry.levelSum += u.level
      entry.levelCount += 1
    }
    if (u.pointsPerDay !== null) {
      entry.pointsPerDaySum += u.pointsPerDay
      entry.pointsPerDayCount += 1
    }
    if (u.health !== null) {
      entry.healthSum += u.health
      entry.healthCount += 1
    }
    if (u.hunger !== null) {
      entry.hungerSum += u.hunger
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
 * Pooled case luck for a group: the members' combined weighted pulls judged
 * against the official odds (see lib/cases.ts), not a mean of member
 * percentages — heavy openers weigh in proportionally.
 */
function aggCaseLuck(agg: MemberAgg): number | null {
  const categorized = agg.casesCommon + agg.casesUncommon + agg.casesRare
    + agg.casesEpic + agg.casesLegendary + agg.casesMythic
  return luckPercent(agg.caseLuckActual, agg.caseLuckExpected, categorized)
}

/**
 * A group row's case-stat fields ({@link GroupCaseStats}), assembled from the
 * aggregate. One spread per builder keeps the field set in one place, next to
 * the aggregation that produces it.
 */
export function aggCases(agg: MemberAgg | undefined): GroupCaseStats {
  return {
    casesOpenedTotal: agg?.casesOpened ?? 0,
    standardCasesOpened: agg?.standardCasesOpened ?? 0,
    mythicCasesOpened: agg?.mythicCasesOpened ?? 0,
    casesCommon: agg?.casesCommon ?? 0,
    casesUncommon: agg?.casesUncommon ?? 0,
    casesRare: agg?.casesRare ?? 0,
    casesEpic: agg?.casesEpic ?? 0,
    casesLegendary: agg?.casesLegendary ?? 0,
    casesMythic: agg?.casesMythic ?? 0,
    caseLuck: agg ? aggCaseLuck(agg) : null,
    caseLuckRank: null,
  }
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
 * A group row's wealth-component fields ({@link GroupWealthParts}), assembled
 * from the aggregate. One spread per builder keeps the field set next to the
 * aggregation that produces it; ranks are filled later by rankAll (the value
 * keys are {@link WEALTH_PART_KEYS}). The alliance builder sums member
 * country rows instead, so it sets these itself.
 */
export function aggWealthParts(agg: MemberAgg | undefined): GroupWealthParts {
  return {
    companiesWealth: agg?.companiesWealth ?? 0,
    companiesWealthRank: null,
    itemsWealth: agg?.itemsWealth ?? 0,
    itemsWealthRank: null,
    cashWealth: agg?.cashWealth ?? 0,
    cashWealthRank: null,
    equipmentWealth: agg?.equipmentWealth ?? 0,
    equipmentWealthRank: null,
    weaponsWealth: agg?.weaponsWealth ?? 0,
    weaponsWealthRank: null,
  }
}

/**
 * The five wealth-component field keys, ranked by the builders (via rankAll)
 * and reused as the sort/filter passthrough in the API routes.
 */
export const WEALTH_PART_KEYS = ['companiesWealth', 'itemsWealth', 'cashWealth', 'equipmentWealth', 'weaponsWealth'] as const

/**
 * A group row's aggregate points fields ({@link GroupPointsStats}): the
 * member-summed totals plus the two per-member averages, all derived from the
 * one-pass aggregate. Ranks are filled later by rankAll (the value keys are
 * {@link POINTS_RANK_KEYS}).
 */
export function aggPoints(agg: MemberAgg | undefined): GroupPointsStats {
  return {
    totalPoints: agg?.total ?? 0,
    totalPointsRank: null,
    avgPoints: aggMean(agg?.total ?? 0, agg?.count ?? 0),
    avgPointsRank: null,
    avgPointsPerDay: aggMean(agg?.pointsPerDaySum ?? 0, agg?.pointsPerDayCount ?? 0),
    levelPoints: agg?.level ?? 0,
    damagePoints: agg?.damage ?? 0,
    wealthPoints: agg?.wealthPoints ?? 0,
  }
}

/**
 * The {@link aggPoints} value keys rankAll should rank.
 */
export const POINTS_RANK_KEYS = ['totalPoints', 'avgPoints'] as const

/**
 * A group row's premium-spend fields ({@link GroupPremiumStats}): members' gems
 * bought, premium months, and premium gifts, summed. Ranks are filled later by
 * rankAll (the value keys are {@link PREMIUM_KEYS}). Alliances carry no
 * premium aggregate, so only the country / MU / party builders spread this.
 */
export function aggPremium(agg: MemberAgg | undefined): GroupPremiumStats {
  return {
    gemsPurchasedTotal: agg?.gemsPurchasedTotal ?? 0,
    gemsPurchasedTotalRank: null,
    premiumMonthsTotal: agg?.premiumMonthsTotal ?? 0,
    premiumMonthsTotalRank: null,
    premiumGiftsTotal: agg?.premiumGiftsTotal ?? 0,
    premiumGiftsTotalRank: null,
  }
}

/**
 * The premium-spend field keys, ranked by the builders (via rankAll) and reused
 * as the sort/filter passthrough in the country / MU / party API routes.
 */
export const PREMIUM_KEYS = ['gemsPurchasedTotal', 'premiumMonthsTotal', 'premiumGiftsTotal'] as const

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

/**
 * A group row's factory fields ({@link GroupFactoryStats}): member-summed
 * production points/day (total + per-member over the entity's member count) and
 * net gold/day, plus efficiency (Σ net ÷ Σ Top-potential, capped at 100, null
 * when nothing's produced). Ranks filled later by rankAll (value keys are
 * {@link FACTORY_RANK_KEYS}). Empty until the factory scrape has run.
 */
export function aggFactories(agg: MemberAgg | undefined): GroupFactoryStats {
  const ppPerDay = agg?.factoryPpPerDay ?? 0
  const netPerDay = agg?.factoryNetPerDay ?? 0
  const top = agg?.factoryTopPotential ?? 0
  return {
    factoryPpPerDay: ppPerDay,
    factoryPpPerDayRank: null,
    factoryPpPerMember: agg && agg.count > 0 ? ppPerDay / agg.count : null,
    factoryPpPerMemberRank: null,
    factoryNetPerDay: netPerDay,
    factoryNetPerDayRank: null,
    factoryEfficiencyPct: top > 0 ? Math.min(100, (netPerDay / top) * 100) : null,
    factoryEfficiencyRank: null,
  }
}

/**
 * The {@link aggFactories} value keys rankAll should rank.
 */
export const FACTORY_RANK_KEYS = ['factoryPpPerDay', 'factoryPpPerMember', 'factoryNetPerDay', 'factoryEfficiencyPct'] as const

/**
 * A group row's member-averaged combat/condition stats ({@link GroupVitals}):
 * average gear score, war-share, health and hunger across the citizens, plus
 * the readiness mix. Ranks are filled later by rankAll. Shared by the country /
 * MU / alliance builders.
 */
export function aggVitals(agg: MemberAgg | undefined): GroupVitals {
  return {
    avgGearScore: aggMean(agg?.gearScoreSum ?? 0, agg?.gearScoreCount ?? 0),
    avgGearScoreRank: null,
    avgWarShare: aggMeanRaw(agg?.warShareSum ?? 0, agg?.warShareCount ?? 0),
    avgWarShareRank: null,
    avgHealth: aggMean(agg?.healthSum ?? 0, agg?.healthCount ?? 0),
    avgHealthRank: null,
    avgHunger: aggMean(agg?.hungerSum ?? 0, agg?.hungerCount ?? 0),
    avgHungerRank: null,
    readinessPill: aggReadinessPill(agg),
  }
}
