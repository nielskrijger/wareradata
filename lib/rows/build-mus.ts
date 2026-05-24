import type { MURow, UserRow } from '@/lib/rows'
import type { Lookups } from '@/lib/rows/lookups'
import type { MU } from '@/lib/warera/api'

import { toTier } from '@/lib/rows/lookups'
import { aggregatePoints } from '@/lib/rows/points-agg'

export function buildMURows(mus: MU[], userRows: UserRow[], lookups: Lookups): MURow[] {
  const pointsByMu = aggregatePoints(userRows, u => u.muId)

  return mus
    .map((m) => {
      const agg = pointsByMu.get(m._id)
      const r = m.rankings
      const investedMoney = m.investedMoneyByUsers
        ? Object.values(m.investedMoneyByUsers).reduce((sum, n) => sum + n, 0)
        : 0
      const region = m.region ? lookups.regionById.get(m.region) : undefined

      // MUs are headquartered in a region; the region's *initial* country is
      // the MU's spiritual home (current owner can change as territory shifts).
      const country = region?.initialCountry
        ? lookups.countryById.get(region.initialCountry)
        : undefined

      return {
        avgLevel: agg && agg.levelCount > 0 ? Math.round(agg.levelSum / agg.levelCount) : null,
        avgPoints: agg ? Math.round(agg.total / agg.count) : null,
        bounty: r?.muBounty?.value ?? null,
        countryCode: country?.code ?? null,
        countryId: region?.initialCountry ?? null,
        countryName: country?.name ?? null,
        damagePoints: agg?.damage ?? 0,
        damageRank: r?.muDamages?.rank ?? null,
        damageTier: toTier(r?.muDamages?.tier),
        damage: r?.muDamages?.value ?? null,
        dormitoriesLevel: m.activeUpgradeLevels?.dormitories ?? null,
        gemsPurchasedTotal: agg?.gemsPurchasedTotal ?? 0,
        headquartersLevel: m.activeUpgradeLevels?.headquarters ?? null,
        id: m._id,
        investedMoney,
        levelPoints: agg?.level ?? 0,
        memberCount: m.members?.length ?? 0,
        mercenaryReputation: m.mercenaryReputation ?? null,
        name: m.name,
        premiumGiftsTotal: agg?.premiumGiftsTotal ?? 0,
        premiumMonthsTotal: agg?.premiumMonthsTotal ?? 0,
        regionName: region?.name ?? null,
        reputation: r?.muReputation?.value ?? null,
        terrain: r?.muTerrain?.value ?? null,
        totalPoints: agg?.total ?? 0,
        wealthPoints: agg?.wealth ?? 0,
        wealthRank: r?.muWealth?.rank ?? null,
        wealth: r?.muWealth?.value ?? null,
        weeklyDamage: r?.muWeeklyDamages?.value ?? null,
      }
    })
    .sort((a, b) => (b.totalPoints - a.totalPoints))
}
