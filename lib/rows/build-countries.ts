import type { CountryRow, UserRow } from '@/lib/rows'
import type { Lookups } from '@/lib/rows/lookups'
import type { Alliance, Country, MU } from '@/lib/warera/api'

import { rankAll, toTier } from '@/lib/rows/lookups'
import { aggCases, aggMean, aggMeanRaw, aggReadinessPill, aggregateMembers } from '@/lib/rows/member-agg'

export function buildCountryRows(
  countries: Country[],
  mus: MU[],
  userRows: UserRow[],
  lookups: Lookups,
  alliances: Alliance[],
): CountryRow[] {
  const membersByCountry = aggregateMembers(userRows, u => u.countryId)
  const musCountByCountry = countMusByCountry(mus, lookups)

  // Country → alliance, derived from the alliances' member lists rather than
  // the country payload's allianceId, so it stays correct even on a snapshot
  // whose countries were scraped before the alliances feature existed.
  const allianceByCountry = new Map<string, { id: string, name: string }>()
  for (const a of alliances) {
    for (const m of a.memberCountries) {
      allianceByCountry.set(m.country, { id: a._id, name: a.name })
    }
  }

  const rows = countries
    .map((c) => {
      const agg = membersByCountry.get(c._id)
      const r = c.rankings
      const unrestPercent = c.unrest?.barMax
        ? ((c.unrest.bar ?? 0) / c.unrest.barMax) * 100
        : null

      return {
        activeBattles: 0,
        activeBattlesList: [],
        activePopulation: r?.countryActivePopulation?.value ?? null,
        activePopulationRank: null,
        allianceId: allianceByCountry.get(c._id)?.id ?? null,
        allianceName: allianceByCountry.get(c._id)?.name ?? null,
        alliesCount: c.allies?.length ?? 0,
        alliesCountRank: null,
        avgGearScore: agg ? aggMean(agg.gearScoreSum, agg.gearScoreCount) : null,
        avgGearScoreRank: null,
        avgWarShare: agg ? aggMeanRaw(agg.warShareSum, agg.warShareCount) : null,
        avgWarShareRank: null,
        avgHealth: agg ? aggMean(agg.healthSum, agg.healthCount) : null,
        avgHealthRank: null,
        avgHunger: agg ? aggMean(agg.hungerSum, agg.hungerCount) : null,
        avgHungerRank: null,
        avgLevel: agg && agg.levelCount > 0 ? Math.round(agg.levelSum / agg.levelCount) : null,
        avgLevelRank: null,
        avgPoints: agg ? Math.round(agg.total / agg.count) : null,
        avgPointsRank: null,
        avgPointsPerDay: agg ? aggMean(agg.pointsPerDaySum, agg.pointsPerDayCount) : null,
        bounty: r?.countryBounty?.value ?? null,
        bountyRank: null,
        citizenWealth: agg?.wealth ?? 0,
        citizenWealthRank: null,
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
        code: c.code,
        damagePoints: agg?.damage ?? 0,
        damageRank: null,
        damageTier: toTier(r?.countryDamages?.tier),
        damage: r?.countryDamages?.value ?? null,
        development: c.development ?? null,
        developmentRank: null,
        gemsPurchasedTotal: agg?.gemsPurchasedTotal ?? 0,
        gemsPurchasedTotalRank: null,
        ...aggCases(agg),
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
        readinessPill: aggReadinessPill(agg),
        specializedItem: c.specializedItem ?? null,
        taxIncome: c.taxes?.income ?? null,
        taxMarket: c.taxes?.market ?? null,
        taxSelfWork: c.taxes?.selfWork ?? null,
        totalPoints: agg?.total ?? 0,
        totalPointsRank: null,
        unrestPercent,
        warsCount: c.warsWith?.length ?? 0,
        warsCountRank: null,
        wealthPoints: agg?.wealthPoints ?? 0,
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
  rankAll(rows, [
    'caseLuck',
    'totalPoints',
    'avgPoints',
    'avgLevel',
    'avgHealth',
    'avgHunger',
    'avgGearScore',
    'avgWarShare',
    'damage',
    'weeklyDamage',
    'weeklyDamagePerCitizen',
    'wealth',
    'citizenWealth',
    'companiesWealth',
    'itemsWealth',
    'cashWealth',
    'equipmentWealth',
    'weaponsWealth',
    'bounty',
    'money',
    'development',
    'productionBonus',
    'activePopulation',
    'musCount',
    'partyCount',
    'alliesCount',
    'warsCount',
    'gemsPurchasedTotal',
    'premiumMonthsTotal',
    'premiumGiftsTotal',
  ])

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
