import type {
  GroupCaseStats,
  GroupFactoryStats,
  GroupPointsStats,
  GroupPremiumStats,
  GroupVitals,
  GroupWealthParts,
  UserRow,
} from '@/lib/rows'

import { luckPercent } from '@/lib/cases'

/**
 * UserRow fields summed as-is over a group's members; a null counts as 0.
 */
const SUM_KEYS = [
  'points',
  'levelPoints',
  'damagePoints',
  'wealthPoints',
  'wealth',
  'companiesWealth',
  'itemsWealth',
  'cashWealth',
  'equipmentWealth',
  'weaponsWealth',
  'gemsPurchased',
  'premiumMonths',
  'premiumGifts',
  'casesOpened',
  'standardCasesOpened',
  'mythicCasesOpened',
  'casesCommon',
  'casesUncommon',
  'casesRare',
  'casesEpic',
  'casesLegendary',
  'casesMythic',
  'caseLuckActual',
  'caseLuckExpected',
  'factoryCount',
  'factoryPpPerDay',
  'factoryNetPerDay',
  'factoryEngineNetPerDay',
  'factoryEmployeeNetPerDay',
  'factoryWorkers',
  'factoryTopPotential',
  'factoryPayrollPerDay',
  'employeeRetiringSoon',
] as const satisfies readonly (keyof UserRow)[]

/**
 * UserRow fields averaged over the members that have a value, so a missing
 * value doesn't drag the mean toward 0.
 */
const MEAN_KEYS = [
  'level',
  'pointsPerDay',
  'health',
  'hunger',
  'gearScore',
  'warShare',
] as const satisfies readonly (keyof UserRow)[]

type MeanKey = (typeof MEAN_KEYS)[number]

export type MemberAgg = Record<(typeof SUM_KEYS)[number] | `${MeanKey}Sum` | `${MeanKey}Count`, number> & {
  count: number
  buffCount: number
  readyCount: number
  debuffCount: number

  /**
   * Per-employee averages weighted by each member's headcount, so a big
   * employer weighs in proportionally.
   */
  employeePpSum: number
  employeeNetSum: number
  employeeKnownCount: number
  employeeHappinessSum: number
  employeeHappinessCount: number
}

function emptyAgg(): MemberAgg {
  const agg: Record<string, number> = {
    count: 0,
    buffCount: 0,
    readyCount: 0,
    debuffCount: 0,
    employeePpSum: 0,
    employeeNetSum: 0,
    employeeKnownCount: 0,
    employeeHappinessSum: 0,
    employeeHappinessCount: 0,
  }

  for (const key of SUM_KEYS) {
    agg[key] = 0
  }

  for (const key of MEAN_KEYS) {
    agg[`${key}Sum`] = 0
    agg[`${key}Count`] = 0
  }

  return agg as MemberAgg
}

/**
 * Sums members' stats into one bucket per `keyFor(user)`; users it maps to
 * null belong to no group.
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

    let entry = out.get(key)
    if (!entry) {
      entry = emptyAgg()
      out.set(key, entry)
    }

    entry.count += 1
    for (const k of SUM_KEYS) {
      entry[k] += u[k] ?? 0
    }

    for (const k of MEAN_KEYS) {
      const v = u[k]
      if (v !== null) {
        entry[`${k}Sum`] += v
        entry[`${k}Count`] += 1
      }
    }

    const workers = u.factoryWorkers ?? 0
    if (u.employeeAvgPpPerDay !== null && u.employeeAvgNetPerDay !== null) {
      entry.employeePpSum += u.employeeAvgPpPerDay * workers
      entry.employeeNetSum += u.employeeAvgNetPerDay * workers
      entry.employeeKnownCount += workers
    }

    if (u.employeeAvgHappiness !== null) {
      entry.employeeHappinessSum += u.employeeAvgHappiness * workers
      entry.employeeHappinessCount += workers
    }

    if (u.readinessStatus === 'buff') {
      entry.buffCount += 1
    } else if (u.readinessStatus === 'debuff') {
      entry.debuffCount += 1
    } else if (u.readinessStatus === 'neither') {
      entry.readyCount += 1
    }
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
    stockpileWealth: (agg?.itemsWealth ?? 0)
      + (agg?.cashWealth ?? 0)
      + (agg?.equipmentWealth ?? 0)
      + (agg?.weaponsWealth ?? 0),
    stockpileWealthRank: null,
  }
}

/**
 * The five wealth-component field keys, ranked by the builders (via rankAll)
 * and reused as the sort/filter passthrough in the API routes.
 */
export const WEALTH_PART_KEYS = [
  'companiesWealth',
  'itemsWealth',
  'cashWealth',
  'equipmentWealth',
  'weaponsWealth',
  'stockpileWealth',
] as const

/**
 * A group row's aggregate points fields ({@link GroupPointsStats}): the
 * member-summed totals plus the two per-member averages, all derived from the
 * one-pass aggregate. Ranks are filled later by rankAll (the value keys are
 * {@link POINTS_RANK_KEYS}).
 */
export function aggPoints(agg: MemberAgg | undefined): GroupPointsStats {
  return {
    totalPoints: agg?.points ?? 0,
    totalPointsRank: null,
    avgPoints: aggMean(agg?.points ?? 0, agg?.count ?? 0),
    avgPointsRank: null,
    avgPointsPerDay: aggMean(agg?.pointsPerDaySum ?? 0, agg?.pointsPerDayCount ?? 0),
    levelPoints: agg?.levelPoints ?? 0,
    damagePoints: agg?.damagePoints ?? 0,
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
    gemsPurchasedTotal: agg?.gemsPurchased ?? 0,
    gemsPurchasedTotalRank: null,
    premiumMonthsTotal: agg?.premiumMonths ?? 0,
    premiumMonthsTotalRank: null,
    premiumGiftsTotal: agg?.premiumGifts ?? 0,
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
 * A group row's factory fields ({@link GroupFactoryStats}): member-summed net
 * gold/day (split into engine vs employees), payroll, NPC employee stats, production
 * points/day, plus efficiency (Σ net ÷ Σ Top-potential, capped at 100, null when
 * nothing's produced). Ranks filled later by rankAll (value keys are
 * {@link FACTORY_RANK_KEYS}). Empty until the factory scrape has run.
 */
export function aggFactories(agg: MemberAgg | undefined): GroupFactoryStats {
  const ppPerDay = agg?.factoryPpPerDay ?? 0
  const netPerDay = agg?.factoryNetPerDay ?? 0
  const top = agg?.factoryTopPotential ?? 0

  return {
    factoryCount: agg?.factoryCount ?? 0,
    factoryCountRank: null,
    factoryPpPerDay: ppPerDay,
    factoryPpPerDayRank: null,
    factoryNetPerDay: netPerDay,
    factoryNetPerDayRank: null,
    factoryEngineNetPerDay: agg?.factoryEngineNetPerDay ?? 0,
    factoryEngineNetPerDayRank: null,
    factoryEmployeeNetPerDay: agg?.factoryEmployeeNetPerDay ?? 0,
    factoryEmployeeNetPerDayRank: null,
    factoryWorkers: agg?.factoryWorkers ?? 0,
    factoryWorkersRank: null,
    factoryEfficiencyPct: top > 0 ? Math.min(100, (netPerDay / top) * 100) : null,
    factoryEfficiencyPctRank: null,
    factoryPayrollPerDay: agg?.factoryPayrollPerDay ?? 0,
    factoryPayrollPerDayRank: null,
    employeeAvgPpPerDay: aggMeanRaw(agg?.employeePpSum ?? 0, agg?.employeeKnownCount ?? 0),
    employeeAvgPpPerDayRank: null,
    employeeAvgNetPerDay: aggMeanRaw(agg?.employeeNetSum ?? 0, agg?.employeeKnownCount ?? 0),
    employeeAvgNetPerDayRank: null,
    employeeAvgHappiness: aggMeanRaw(agg?.employeeHappinessSum ?? 0, agg?.employeeHappinessCount ?? 0),
    employeeAvgHappinessRank: null,
    employeeRetiringSoon: agg?.employeeRetiringSoon ?? 0,
    employeeRetiringSoonRank: null,
  }
}

/**
 * The {@link aggFactories} value keys rankAll should rank.
 */
export const FACTORY_RANK_KEYS = [
  'factoryCount',
  'factoryPpPerDay',
  'factoryNetPerDay',
  'factoryEngineNetPerDay',
  'factoryEmployeeNetPerDay',
  'factoryWorkers',
  'factoryEfficiencyPct',
  'factoryPayrollPerDay',
  'employeeAvgPpPerDay',
  'employeeAvgNetPerDay',
  'employeeAvgHappiness',
  'employeeRetiringSoon',
] as const

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
