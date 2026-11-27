import type { PartyRow, UserRow } from '@/lib/rows'
import type { Lookups } from '@/lib/rows/lookups'
import type { Party } from '@/lib/warera/api'

import { leaderFields, rankAll } from '@/lib/rows/lookups'
import {
  aggCases,
  aggFactories,
  aggMean,
  aggPoints,
  aggPremium,
  aggregateMembers,
  aggWealthParts,
  FACTORY_RANK_KEYS,
  POINTS_RANK_KEYS,
  PREMIUM_KEYS,
  WEALTH_PART_KEYS,
} from '@/lib/rows/member-agg'

export function buildPartyRows(parties: Party[], userRows: UserRow[], lookups: Lookups): PartyRow[] {
  // partyByUser is built once in buildBaseLookups (also consumed by buildUserRows
  // to set partyId/partyName on each user row).
  const membersByParty = aggregateMembers(userRows, u => lookups.partyByUser.get(u.id)?.id ?? null)

  const rows = parties
    .map((p) => {
      const agg = membersByParty.get(p._id)
      const country = p.country ? lookups.countryById.get(p.country) : undefined
      const leader = leaderFields(p.leader ?? null, lookups)

      return {
        avatarUrl: p.avatarUrl ?? null,
        avgLevel: aggMean(agg?.levelSum ?? 0, agg?.levelCount ?? 0),
        avgLevelRank: null,
        countryCode: country?.code ?? null,
        countryId: p.country ?? null,
        countryName: country?.name ?? null,
        createdAt: p.createdAt ?? null,
        description: p.description ?? null,
        ...aggCases(agg),
        ...aggFactories(agg),
        ...aggPoints(agg),
        ...aggPremium(agg),
        ...aggWealthParts(agg),
        id: p._id,
        ...leader,
        memberCount: p.members?.length ?? 0,
        memberCountRank: null,
        memberWealth: agg?.wealth ?? 0,
        memberWealthRank: null,
        name: p.name,
      } satisfies PartyRow
    })
    .sort((a, b) => b.totalPoints - a.totalPoints)

  // Rank parties against each other on the aggregate stats (standard
  // competition rank over the snapshot).
  rankAll(rows, [
    'caseLuck',
    ...POINTS_RANK_KEYS,
    'avgLevel',
    'memberCount',
    'memberWealth',
    ...WEALTH_PART_KEYS,
    ...FACTORY_RANK_KEYS,
    ...PREMIUM_KEYS,
  ])

  return rows
}
