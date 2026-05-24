import type { PartyRow, UserRow } from '@/lib/rows'
import type { Lookups } from '@/lib/rows/lookups'
import type { Party } from '@/lib/warera/schemas'

import { aggregatePoints } from '@/lib/rows/points-agg'

export function buildPartyRows(parties: Party[], userRows: UserRow[], lookups: Lookups): PartyRow[] {
  // partyByUser is built once in buildLookups (also consumed by buildUserRows
  // to set partyId/partyName on each user row).
  const pointsByParty = aggregatePoints(userRows, u => lookups.partyByUser.get(u.id)?.id ?? null)

  return parties
    .map((p) => {
      const agg = pointsByParty.get(p._id)
      const country = p.country ? lookups.countryById.get(p.country) : undefined
      const leaderName = p.leader ? lookups.userNameById.get(p.leader) ?? null : null
      const ethics = p.ethics

      return {
        avgLevel: agg && agg.levelCount > 0 ? Math.round(agg.levelSum / agg.levelCount) : null,
        avgPoints: agg ? Math.round(agg.total / agg.count) : null,
        countryCode: country?.code ?? null,
        countryId: p.country ?? null,
        countryName: country?.name ?? null,
        createdAt: p.createdAt ?? null,
        damagePoints: agg?.damage ?? 0,
        description: p.description ?? null,
        gemsPurchasedTotal: agg?.gemsPurchasedTotal ?? 0,
        id: p._id,
        imperialism: ethics?.imperialism ?? null,
        industrialism: ethics?.industrialism ?? null,
        isolationism: ethics?.isolationism ?? null,
        leaderName,
        levelPoints: agg?.level ?? 0,
        memberCount: p.members?.length ?? 0,
        militarism: ethics?.militarism ?? null,
        name: p.name,
        premiumGiftsTotal: agg?.premiumGiftsTotal ?? 0,
        premiumMonthsTotal: agg?.premiumMonthsTotal ?? 0,
        totalPoints: agg?.total ?? 0,
        wealthPoints: agg?.wealth ?? 0,
      }
    })
    .sort((a, b) => b.totalPoints - a.totalPoints)
}
