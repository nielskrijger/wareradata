import type { CaseRarity, CasesBreakdown, CaseStat } from '@/lib/warera/api'

import { CASE_RARITIES } from '@/lib/warera/api'

/**
 * Official per-rarity drop rates (percent) per case type, as shown on the
 * in-game case screens (not exposed by the game config API). Validated against
 * the population's ~10M recorded pulls: the empirical byRarity distribution
 * over categorized pulls reproduces these within noise. Each case type has its
 * own table — the premium case2 never drops common and is ~50x richer at the
 * top end, so luck must be judged per case type.
 */
const CASE_DROP_RATES: Record<'case1' | 'case2', Record<CaseRarity, number>> = {
  case1: { common: 62, uncommon: 30, rare: 7.1, epic: 0.85, legendary: 0.04, mythic: 0.01 },
  case2: { common: 0, uncommon: 50, rare: 32, epic: 15, legendary: 2.5, mythic: 0.5 },
}

/**
 * Minimum categorized pulls before a luck percentage is shown. Below this the
 * estimate is dominated by variance (one lucky pull on a handful of opens
 * reads as absurd luck), so the stat stays null and unranked.
 */
export const MIN_LUCK_PULLS = 25

interface LuckScores {
  // Inverse-probability-weighted sum of actual pulls: a pull of rarity r in
  // case type t scores 1/p(t,r), so a mythic counts proportionally to its
  // rareness under that case's own odds.
  actual: number
  // What `actual` is expected to be under the official odds for the same pull
  // counts: per categorized pull, sum(p * 1/p) = the number of droppable
  // rarities of that case type.
  expected: number
  // Total pulls with a rarity bucket. byRarity sums to less than openedCount
  // (some opens drop non-rarity loot like money), so this is the denominator
  // population, not openedCount.
  categorized: number
}

/**
 * Accumulates one case type's byRarity counts into weighted actual/expected
 * scores. Scores are additive across case types and across users, so group
 * luck pools members' scores rather than averaging their percentages.
 */
function accumulate(scores: LuckScores, type: 'case1' | 'case2', byRarity: Partial<Record<CaseRarity, number>>): void {
  const rates = CASE_DROP_RATES[type]

  let pulls = 0
  let droppable = 0
  for (const rarity of CASE_RARITIES) {
    const p = rates[rarity] / 100
    if (p === 0) {
      continue
    }
    droppable += 1
    const count = byRarity[rarity] ?? 0
    pulls += count
    scores.actual += count / p
  }

  scores.expected += pulls * droppable
  scores.categorized += pulls
}

/**
 * Weighted luck scores for one user's raw case stats. Returns zeroed scores
 * when the user has no categorized pulls.
 */
export function caseLuckScores(stats: { case1?: CaseStat, case2?: CaseStat } | undefined): LuckScores {
  const scores: LuckScores = { actual: 0, expected: 0, categorized: 0 }
  if (!stats) {
    return scores
  }

  for (const type of ['case1', 'case2'] as const) {
    const byRarity = stats[type]?.byRarity
    if (byRarity) {
      accumulate(scores, type, byRarity)
    }
  }
  return scores
}

/**
 * Luck as a percentage of the officially expected score (100 = exactly the
 * published odds, above = lucky), or null under {@link MIN_LUCK_PULLS}.
 */
export function luckPercent(actual: number, expected: number, categorized: number): number | null {
  if (expected <= 0 || categorized < MIN_LUCK_PULLS) {
    return null
  }
  return Math.round((actual / expected) * 1000) / 10
}

/**
 * Reassembles a {@link CasesBreakdown} from a row's flat per-rarity counts
 * (the rows carry only the flats; this feeds the user page's cases card).
 * Null when no case stats were captured for the row.
 */
export function casesBreakdownFromRow(row: Partial<Record<`cases${Capitalize<CaseRarity>}`, number | null>>): CasesBreakdown | null {
  const byRarity: Partial<Record<CaseRarity, number>> = {}

  let total = 0
  let captured = false
  for (const rarity of CASE_RARITIES) {
    const count = row[`cases${rarity[0].toUpperCase()}${rarity.slice(1)}` as keyof typeof row]
    if (count === null || count === undefined) {
      continue
    }
    captured = true
    if (count > 0) {
      byRarity[rarity] = count
      total += count
    }
  }

  return captured && total > 0 ? { byRarity, total } : null
}
