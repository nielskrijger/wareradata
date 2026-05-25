import type { MURow, UserRow } from '@/lib/rows'
import type { Lookups } from '@/lib/rows/lookups'
import type { MU } from '@/lib/warera/api'

import { assignRank, toTier } from '@/lib/rows/lookups'
import { aggMean, aggregatePoints } from '@/lib/rows/points-agg'

export function buildMURows(mus: MU[], userRows: UserRow[], lookups: Lookups): MURow[] {
  const pointsByMu = aggregatePoints(userRows, u => u.muId)

  const rows = mus
    .map((m) => {
      const agg = pointsByMu.get(m._id)
      const r = m.rankings
      const investedMoney = m.investedMoneyByUsers
        ? Object.values(m.investedMoneyByUsers).reduce((sum, n) => sum + n, 0)
        : 0
      const region = m.region ? lookups.regionById.get(m.region) : undefined
      const leaderId = m.user ?? null
      const leaderName = leaderId ? lookups.userNameById.get(leaderId) ?? null : null
      const leaderAvatarUrl = leaderId ? lookups.userAvatarById.get(leaderId) ?? null : null
      const leaderColorScheme = leaderId ? lookups.userColorSchemeById.get(leaderId) ?? null : null

      // MUs are headquartered in a region; the region's *initial* country is
      // the MU's spiritual home (current owner can change as territory shifts).
      const country = region?.initialCountry
        ? lookups.countryById.get(region.initialCountry)
        : undefined

      return {
        avatarUrl: m.avatarUrl ?? null,
        avgHealth: agg ? aggMean(agg.healthSum, agg.healthCount) : null,
        avgHealthRank: null,
        avgHunger: agg ? aggMean(agg.hungerSum, agg.hungerCount) : null,
        avgHungerRank: null,
        avgLevel: agg && agg.levelCount > 0 ? Math.round(agg.levelSum / agg.levelCount) : null,
        avgLevelRank: null,
        avgPoints: agg ? Math.round(agg.total / agg.count) : null,
        avgPointsRank: null,
        bounty: r?.muBounty?.value ?? null,
        bountyRank: null,
        countryCode: country?.code ?? null,
        countryId: region?.initialCountry ?? null,
        countryName: country?.name ?? null,
        damagePoints: agg?.damage ?? 0,
        damageRank: null,
        damageTier: toTier(r?.muDamages?.tier),
        damage: r?.muDamages?.value ?? null,
        dormitoriesLevel: m.activeUpgradeLevels?.dormitories ?? null,
        dormitoriesLevelRank: null,
        gemsPurchasedTotal: agg?.gemsPurchasedTotal ?? 0,
        gemsPurchasedTotalRank: null,
        headquartersLevel: m.activeUpgradeLevels?.headquarters ?? null,
        headquartersLevelRank: null,
        id: m._id,
        investedMoney,
        investedMoneyRank: null,
        leaderAvatarUrl,
        leaderColorScheme,
        leaderId,
        leaderName,
        levelPoints: agg?.level ?? 0,
        memberCount: m.members?.length ?? 0,
        memberCountRank: null,
        name: m.name,
        premiumGiftsTotal: agg?.premiumGiftsTotal ?? 0,
        premiumGiftsTotalRank: null,
        premiumMonthsTotal: agg?.premiumMonthsTotal ?? 0,
        premiumMonthsTotalRank: null,
        regionName: region?.name ?? null,
        reputation: r?.muReputation?.value ?? null,
        reputationRank: null,
        terrain: r?.muTerrain?.value ?? null,
        terrainRank: null,
        totalPoints: agg?.total ?? 0,
        totalPointsRank: null,
        wealthPoints: agg?.wealth ?? 0,
        wealthRank: null,
        wealth: r?.muWealth?.value ?? null,
        weeklyDamage: r?.muWeeklyDamages?.value ?? null,
        weeklyDamageRank: null,
      } satisfies MURow
    })
    .sort((a, b) => (b.totalPoints - a.totalPoints))

  // Rank MUs against each other (not as a sum of members) on every numeric
  // stat. Standard competition rank, computed over our snapshot — so each
  // "#X of N" line on the detail page shares the same N. We recompute the
  // damage/wealth ranks the API also provides, trading its global denominator
  // for one consistent with the rest of the card grid.
  assignRank(rows, 'totalPoints', 'totalPointsRank')
  assignRank(rows, 'avgPoints', 'avgPointsRank')
  assignRank(rows, 'avgLevel', 'avgLevelRank')
  assignRank(rows, 'avgHealth', 'avgHealthRank')
  assignRank(rows, 'avgHunger', 'avgHungerRank')
  assignRank(rows, 'damage', 'damageRank')
  assignRank(rows, 'weeklyDamage', 'weeklyDamageRank')
  assignRank(rows, 'bounty', 'bountyRank')
  assignRank(rows, 'wealth', 'wealthRank')
  assignRank(rows, 'terrain', 'terrainRank')
  assignRank(rows, 'reputation', 'reputationRank')
  assignRank(rows, 'memberCount', 'memberCountRank')
  assignRank(rows, 'investedMoney', 'investedMoneyRank')
  assignRank(rows, 'dormitoriesLevel', 'dormitoriesLevelRank')
  assignRank(rows, 'headquartersLevel', 'headquartersLevelRank')
  assignRank(rows, 'gemsPurchasedTotal', 'gemsPurchasedTotalRank')
  assignRank(rows, 'premiumMonthsTotal', 'premiumMonthsTotalRank')
  assignRank(rows, 'premiumGiftsTotal', 'premiumGiftsTotalRank')

  return rows
}
