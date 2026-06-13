import type { MURow, UserRow } from '@/lib/rows'
import type { Lookups } from '@/lib/rows/lookups'
import type { MU } from '@/lib/warera/api'

import { rankAll, toTier } from '@/lib/rows/lookups'
import { aggCases, aggMean, aggMeanRaw, aggPoints, aggPremium, aggReadinessPill, aggregateMembers, aggWealthParts, POINTS_RANK_KEYS, PREMIUM_RANK_KEYS, WEALTH_PART_RANK_KEYS } from '@/lib/rows/member-agg'

export function buildMURows(mus: MU[], userRows: UserRow[], lookups: Lookups): MURow[] {
  const membersByMu = aggregateMembers(userRows, u => u.muId)

  const rows = mus
    .map((m) => {
      const agg = membersByMu.get(m._id)
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
        bounty: r?.muBounty?.value ?? null,
        bountyRank: null,
        countryCode: country?.code ?? null,
        countryId: region?.initialCountry ?? null,
        countryName: country?.name ?? null,
        damageRank: null,
        damageTier: toTier(r?.muDamages?.tier),
        damage: r?.muDamages?.value ?? null,
        dormitoriesLevel: m.activeUpgradeLevels?.dormitories ?? null,
        dormitoriesLevelRank: null,
        ...aggCases(agg),
        ...aggPoints(agg),
        ...aggPremium(agg),
        ...aggWealthParts(agg),
        headquartersLevel: m.activeUpgradeLevels?.headquarters ?? null,
        headquartersLevelRank: null,
        id: m._id,
        investedMoney,
        investedMoneyRank: null,
        lastRefreshedAt: m.lastRefreshedAt ?? null,
        leaderAvatarUrl,
        leaderColorScheme,
        leaderId,
        leaderName,
        memberCount: m.members?.length ?? 0,
        memberCountRank: null,
        memberWealth: agg?.wealth ?? 0,
        memberWealthRank: null,
        name: m.name,
        readinessPill: aggReadinessPill(agg),
        regionName: region?.name ?? null,
        reputation: r?.muReputation?.value ?? null,
        reputationRank: null,
        terrain: r?.muTerrain?.value ?? null,
        terrainRank: null,
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
  rankAll(rows, [
    'caseLuck',
    ...POINTS_RANK_KEYS,
    'avgLevel',
    'avgHealth',
    'avgHunger',
    'avgGearScore',
    'avgWarShare',
    'damage',
    'weeklyDamage',
    'bounty',
    'wealth',
    'terrain',
    'reputation',
    'memberCount',
    'memberWealth',
    ...WEALTH_PART_RANK_KEYS,
    'investedMoney',
    'dormitoriesLevel',
    'headquartersLevel',
    ...PREMIUM_RANK_KEYS,
  ])

  return rows
}
