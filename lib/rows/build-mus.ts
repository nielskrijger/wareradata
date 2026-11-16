import type { MURow, UserRow } from '@/lib/rows'
import type { Lookups } from '@/lib/rows/lookups'
import type { MU } from '@/lib/warera/api'

import { leaderFields, rankAll, toTier } from '@/lib/rows/lookups'
import {
  aggCases,
  aggFactories,
  aggMean,
  aggPoints,
  aggPremium,
  aggregateMembers,
  aggVitals,
  aggWealthParts,
  FACTORY_RANK_KEYS,
  POINTS_RANK_KEYS,
  PREMIUM_KEYS,
  WEALTH_PART_KEYS,
} from '@/lib/rows/member-agg'

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
      const leader = leaderFields(m.user ?? null, lookups)

      // MUs are headquartered in a region; the region's *initial* country is
      // the MU's spiritual home (current owner can change as territory shifts).
      const country = region?.initialCountry ? lookups.countryById.get(region.initialCountry) : undefined

      return {
        avatarUrl: m.avatarUrl ?? null,
        ...aggVitals(agg),
        avgLevel: aggMean(agg?.levelSum ?? 0, agg?.levelCount ?? 0),
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
        ...aggFactories(agg),
        ...aggPoints(agg),
        ...aggPremium(agg),
        ...aggWealthParts(agg),
        headquartersLevel: m.activeUpgradeLevels?.headquarters ?? null,
        headquartersLevelRank: null,
        id: m._id,
        investedMoney,
        investedMoneyRank: null,
        lastRefreshedAt: m.lastRefreshedAt ?? null,
        ...leader,
        memberCount: m.members?.length ?? 0,
        memberCountRank: null,
        memberWealth: agg?.wealth ?? 0,
        memberWealthRank: null,
        name: m.name,
        regionName: region?.name ?? null,
        reputation: r?.muReputation?.value ?? m.mercenaryReputation ?? null,
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

  // Damage and wealth are re-ranked here instead of using the API's global
  // ranks, so every "#X of N" on the detail page shares one N.
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
    ...WEALTH_PART_KEYS,
    ...FACTORY_RANK_KEYS,
    'investedMoney',
    'dormitoriesLevel',
    'headquartersLevel',
    ...PREMIUM_KEYS,
  ])

  return rows
}
