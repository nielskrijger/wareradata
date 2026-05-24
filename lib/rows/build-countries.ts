import type { CountryRow, UserRow } from '@/lib/rows'
import type { Lookups } from '@/lib/rows/lookups'
import type { Country, MU } from '@/lib/warera/schemas'

import { aggregatePoints } from '@/lib/rows/points-agg'

export function buildCountryRows(
  countries: Country[],
  mus: MU[],
  userRows: UserRow[],
  lookups: Lookups,
): CountryRow[] {
  const pointsByCountry = aggregatePoints(userRows, u => u.countryId)
  const musCountByCountry = countMusByCountry(mus, lookups)

  return countries
    .map((c) => {
      const agg = pointsByCountry.get(c._id)
      const r = c.rankings
      const unrestPercent = c.unrest?.barMax
        ? ((c.unrest.bar ?? 0) / c.unrest.barMax) * 100
        : null

      return {
        activePopulation: r?.countryActivePopulation?.value ?? null,
        alliesCount: c.allies?.length ?? 0,
        avgPoints: agg ? Math.round(agg.total / agg.count) : null,
        bountyValue: r?.countryBounty?.value ?? null,
        code: c.code,
        damagePoints: agg?.damage ?? 0,
        damageRank: r?.countryDamages?.rank ?? null,
        damageTier: r?.countryDamages?.tier ?? null,
        damageValue: r?.countryDamages?.value ?? null,
        development: c.development ?? null,
        id: c._id,
        levelPoints: agg?.level ?? 0,
        money: c.money ?? null,
        musCount: musCountByCountry.get(c._id) ?? 0,
        name: c.name,
        partyCount: lookups.partyCountByCountry.get(c._id) ?? 0,
        productionBonusValue: r?.countryProductionBonus?.value ?? null,
        specializedItem: c.specializedItem ?? null,
        taxIncome: c.taxes?.income ?? null,
        taxMarket: c.taxes?.market ?? null,
        taxSelfWork: c.taxes?.selfWork ?? null,
        totalPoints: agg?.total ?? 0,
        unrestPercent,
        warsCount: c.warsWith?.length ?? 0,
        wealthPoints: agg?.wealth ?? 0,
        wealthRank: r?.countryWealth?.rank ?? null,
        wealthValue: r?.countryWealth?.value ?? null,
        weeklyDamagePerCitizenValue: r?.weeklyCountryDamagesPerCitizen?.value ?? null,
        weeklyDamageValue: r?.weeklyCountryDamages?.value ?? null,
      }
    })
    .sort((a, b) => {
      if (a.damageRank === null) {
        return 1
      }
      if (b.damageRank === null) {
        return -1
      }
      return a.damageRank - b.damageRank
    })
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
