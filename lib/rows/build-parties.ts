import type { PartyRow, UserRow } from '@/lib/rows'
import type { Lookups } from '@/lib/rows/lookups'
import type { Party } from '@/lib/warera/api'

import { rankAll } from '@/lib/rows/lookups'
import { aggCases, aggPoints, aggPremium, aggregateMembers, aggWealthParts, POINTS_RANK_KEYS, PREMIUM_RANK_KEYS, WEALTH_PART_RANK_KEYS } from '@/lib/rows/member-agg'

export function buildPartyRows(parties: Party[], userRows: UserRow[], lookups: Lookups): PartyRow[] {
  // partyByUser is built once in buildLookups (also consumed by buildUserRows
  // to set partyId/partyName on each user row).
  const membersByParty = aggregateMembers(userRows, u => lookups.partyByUser.get(u.id)?.id ?? null)

  const rows = parties
    .map((p) => {
      const agg = membersByParty.get(p._id)
      const country = p.country ? lookups.countryById.get(p.country) : undefined
      const leaderName = p.leader ? lookups.userNameById.get(p.leader) ?? null : null
      const leaderAvatarUrl = p.leader ? lookups.userAvatarById.get(p.leader) ?? null : null
      const leaderColorScheme = p.leader ? lookups.userColorSchemeById.get(p.leader) ?? null : null
      const ethics = p.ethics

      return {
        avatarUrl: p.avatarUrl ?? null,
        avgLevel: agg && agg.levelCount > 0 ? Math.round(agg.levelSum / agg.levelCount) : null,
        avgLevelRank: null,
        countryCode: country?.code ?? null,
        countryId: p.country ?? null,
        countryName: country?.name ?? null,
        createdAt: p.createdAt ?? null,
        description: p.description ?? null,
        ...aggCases(agg),
        ...aggPoints(agg),
        ...aggPremium(agg),
        ...aggWealthParts(agg),
        id: p._id,
        imperialism: ethics?.imperialism ?? null,
        industrialism: ethics?.industrialism ?? null,
        isolationism: ethics?.isolationism ?? null,
        leaderAvatarUrl,
        leaderColorScheme,
        leaderId: p.leader ?? null,
        leaderName,
        memberCount: p.members?.length ?? 0,
        memberCountRank: null,
        memberWealth: agg?.wealth ?? 0,
        militarism: ethics?.militarism ?? null,
        name: p.name,
      } satisfies PartyRow
    })
    .sort((a, b) => b.totalPoints - a.totalPoints)

  // Rank parties against each other on the aggregate stats (standard
  // competition rank over the snapshot). Ethics are a -2..+2 policy scale, not
  // a leaderboard, so they get no rank.
  rankAll(rows, [
    'caseLuck',
    ...POINTS_RANK_KEYS,
    'avgLevel',
    'memberCount',
    ...WEALTH_PART_RANK_KEYS,
    ...PREMIUM_RANK_KEYS,
  ])

  return rows
}
