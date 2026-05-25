import type { CountryRow, UserRow } from '@/lib/rows'
import type { Lookups } from '@/lib/rows/lookups'
import type { Country, MU } from '@/lib/warera/api'

import { assignRank, toTier } from '@/lib/rows/lookups'
import { aggCombatMix, aggMean, aggregatePoints } from '@/lib/rows/points-agg'

export function buildCountryRows(
  countries: Country[],
  mus: MU[],
  userRows: UserRow[],
  lookups: Lookups,
): CountryRow[] {
  const pointsByCountry = aggregatePoints(userRows, u => u.countryId)
  const musCountByCountry = countMusByCountry(mus, lookups)

  const rows = countries
    .map((c) => {
      const agg = pointsByCountry.get(c._id)
      const r = c.rankings
      const unrestPercent = c.unrest?.barMax
        ? ((c.unrest.bar ?? 0) / c.unrest.barMax) * 100
        : null

      return {
        activeBattles: 0,
        activeBattlesList: [],
        activePopulation: r?.countryActivePopulation?.value ?? null,
        activePopulationRank: null,
        alliesCount: c.allies?.length ?? 0,
        alliesCountRank: null,
        avgHealth: agg ? aggMean(agg.healthSum, agg.healthCount) : null,
        avgHealthRank: null,
        avgHunger: agg ? aggMean(agg.hungerSum, agg.hungerCount) : null,
        avgHungerRank: null,
        avgLevel: agg && agg.levelCount > 0 ? Math.round(agg.levelSum / agg.levelCount) : null,
        avgLevelRank: null,
        avgPoints: agg ? Math.round(agg.total / agg.count) : null,
        avgPointsRank: null,
        bounty: r?.countryBounty?.value ?? null,
        bountyRank: null,
        code: c.code,
        combatMix: aggCombatMix(agg),
        damagePoints: agg?.damage ?? 0,
        damageRank: null,
        damageTier: toTier(r?.countryDamages?.tier),
        damage: r?.countryDamages?.value ?? null,
        development: c.development ?? null,
        developmentRank: null,
        gemsPurchasedTotal: agg?.gemsPurchasedTotal ?? 0,
        gemsPurchasedTotalRank: null,
        id: c._id,
        levelPoints: agg?.level ?? 0,
        money: c.money ?? null,
        moneyRank: null,
        musCount: musCountByCountry.get(c._id) ?? 0,
        musCountRank: null,
        name: c.name,
        partyCount: lookups.partyCountByCountry.get(c._id) ?? 0,
        partyCountRank: null,
        premiumGiftsTotal: agg?.premiumGiftsTotal ?? 0,
        premiumGiftsTotalRank: null,
        premiumMonthsTotal: agg?.premiumMonthsTotal ?? 0,
        premiumMonthsTotalRank: null,
        productionBonus: r?.countryProductionBonus?.value ?? null,
        productionBonusRank: null,
        specializedItem: c.specializedItem ?? null,
        taxIncome: c.taxes?.income ?? null,
        taxMarket: c.taxes?.market ?? null,
        taxSelfWork: c.taxes?.selfWork ?? null,
        totalPoints: agg?.total ?? 0,
        totalPointsRank: null,
        unrestPercent,
        warsCount: c.warsWith?.length ?? 0,
        warsCountRank: null,
        wealthPoints: agg?.wealth ?? 0,
        wealthRank: null,
        wealth: r?.countryWealth?.value ?? null,
        weeklyDamagePerCitizen: r?.weeklyCountryDamagesPerCitizen?.value ?? null,
        weeklyDamagePerCitizenRank: null,
        weeklyDamage: r?.weeklyCountryDamages?.value ?? null,
        weeklyDamageRank: null,
      } satisfies CountryRow
    })
    .sort((a, b) => b.totalPoints - a.totalPoints)

  // Rank countries against each other on every numeric stat (standard
  // competition rank over the snapshot). Recomputing damage/wealth too so each
  // "#X of N" on the detail page shares one denominator. Taxes and unrest are
  // policy settings (lower isn't "better" in a leaderboard sense), so they get
  // no rank.
  assignRank(rows, 'totalPoints', 'totalPointsRank')
  assignRank(rows, 'avgPoints', 'avgPointsRank')
  assignRank(rows, 'avgLevel', 'avgLevelRank')
  assignRank(rows, 'avgHealth', 'avgHealthRank')
  assignRank(rows, 'avgHunger', 'avgHungerRank')
  assignRank(rows, 'damage', 'damageRank')
  assignRank(rows, 'weeklyDamage', 'weeklyDamageRank')
  assignRank(rows, 'weeklyDamagePerCitizen', 'weeklyDamagePerCitizenRank')
  assignRank(rows, 'wealth', 'wealthRank')
  assignRank(rows, 'bounty', 'bountyRank')
  assignRank(rows, 'money', 'moneyRank')
  assignRank(rows, 'development', 'developmentRank')
  assignRank(rows, 'productionBonus', 'productionBonusRank')
  assignRank(rows, 'activePopulation', 'activePopulationRank')
  assignRank(rows, 'musCount', 'musCountRank')
  assignRank(rows, 'partyCount', 'partyCountRank')
  assignRank(rows, 'alliesCount', 'alliesCountRank')
  assignRank(rows, 'warsCount', 'warsCountRank')
  assignRank(rows, 'gemsPurchasedTotal', 'gemsPurchasedTotalRank')
  assignRank(rows, 'premiumMonthsTotal', 'premiumMonthsTotalRank')
  assignRank(rows, 'premiumGiftsTotal', 'premiumGiftsTotalRank')

  return rows
}

/**
 * MUs are headquartered in a region; a MU "belongs to" its region's
 * initialCountry for ranking purposes. Same logic powers buildMURows' country
 * attribution.
 */
function countMusByCountry(mus: MU[], lookups: Lookups): Map<string, number> {
  const out = new Map<string, number>()
  for (const m of mus) {
    const region = m.region ? lookups.regionById.get(m.region) : undefined
    const countryId = region?.initialCountry
    if (countryId) {
      out.set(countryId, (out.get(countryId) ?? 0) + 1)
    }
  }
  return out
}
