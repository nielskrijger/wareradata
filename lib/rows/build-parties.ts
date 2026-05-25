import type { PartyRow, UserRow } from '@/lib/rows'
import type { Lookups } from '@/lib/rows/lookups'
import type { Party } from '@/lib/warera/api'

import { assignRank } from '@/lib/rows/lookups'
import { aggregatePoints } from '@/lib/rows/points-agg'

export function buildPartyRows(parties: Party[], userRows: UserRow[], lookups: Lookups): PartyRow[] {
  // partyByUser is built once in buildLookups (also consumed by buildUserRows
  // to set partyId/partyName on each user row).
  const pointsByParty = aggregatePoints(userRows, u => lookups.partyByUser.get(u.id)?.id ?? null)

  const rows = parties
    .map((p) => {
      const agg = pointsByParty.get(p._id)
      const country = p.country ? lookups.countryById.get(p.country) : undefined
      const leaderName = p.leader ? lookups.userNameById.get(p.leader) ?? null : null
      const leaderAvatarUrl = p.leader ? lookups.userAvatarById.get(p.leader) ?? null : null
      const leaderColorScheme = p.leader ? lookups.userColorSchemeById.get(p.leader) ?? null : null
      const ethics = p.ethics

      return {
        avatarUrl: p.avatarUrl ?? null,
        avgLevel: agg && agg.levelCount > 0 ? Math.round(agg.levelSum / agg.levelCount) : null,
        avgLevelRank: null,
        avgPoints: agg ? Math.round(agg.total / agg.count) : null,
        avgPointsRank: null,
        countryCode: country?.code ?? null,
        countryId: p.country ?? null,
        countryName: country?.name ?? null,
        createdAt: p.createdAt ?? null,
        damagePoints: agg?.damage ?? 0,
        description: p.description ?? null,
        gemsPurchasedTotal: agg?.gemsPurchasedTotal ?? 0,
        gemsPurchasedTotalRank: null,
        id: p._id,
        imperialism: ethics?.imperialism ?? null,
        industrialism: ethics?.industrialism ?? null,
        isolationism: ethics?.isolationism ?? null,
        leaderAvatarUrl,
        leaderColorScheme,
        leaderId: p.leader ?? null,
        leaderName,
        levelPoints: agg?.level ?? 0,
        memberCount: p.members?.length ?? 0,
        memberCountRank: null,
        militarism: ethics?.militarism ?? null,
        name: p.name,
        premiumGiftsTotal: agg?.premiumGiftsTotal ?? 0,
        premiumGiftsTotalRank: null,
        premiumMonthsTotal: agg?.premiumMonthsTotal ?? 0,
        premiumMonthsTotalRank: null,
        totalPoints: agg?.total ?? 0,
        totalPointsRank: null,
        wealthPoints: agg?.wealth ?? 0,
      } satisfies PartyRow
    })
    .sort((a, b) => b.totalPoints - a.totalPoints)

  // Rank parties against each other on the aggregate stats (standard
  // competition rank over the snapshot). Ethics are a -2..+2 policy scale, not
  // a leaderboard, so they get no rank.
  assignRank(rows, 'totalPoints', 'totalPointsRank')
  assignRank(rows, 'avgPoints', 'avgPointsRank')
  assignRank(rows, 'avgLevel', 'avgLevelRank')
  assignRank(rows, 'memberCount', 'memberCountRank')
  assignRank(rows, 'gemsPurchasedTotal', 'gemsPurchasedTotalRank')
  assignRank(rows, 'premiumMonthsTotal', 'premiumMonthsTotalRank')
  assignRank(rows, 'premiumGiftsTotal', 'premiumGiftsTotalRank')

  return rows
}
