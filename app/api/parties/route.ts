import type { FieldAliases } from '@/lib/query'
import type { PartyRow } from '@/lib/rows'

import { getSnapshot } from '@/lib/cache/memory'
import { applyStructuredQuery, parseQuery } from '@/lib/query'

export const dynamic = 'force-dynamic'

/**
 * Friendly field names for the advanced filter. Keep in sync with the
 * popover cheatsheet in `parties-table.tsx`.
 */
const partyFieldAliases: FieldAliases = {
  country: 'countryCode',
  leader: 'leaderName',
  members: 'memberCount',
  points: 'totalPoints',
  avg: 'avgPoints',
  gems: 'gemsPurchasedTotal',
  premiumMonths: 'premiumMonthsTotal',
  premiumGifts: 'premiumGiftsTotal',
  avgLevel: 'avgLevel',
  level: 'avgLevel',
}

/**
 * Maps a column id from the client to a comparable value on the row.
 */
function partySortValue(row: PartyRow, sort: string): number | string | null {
  switch (sort) {
    case 'avgLevel': return row.avgLevel
    case 'avgPoints': return row.avgPoints
    case 'countryName': return row.countryName?.toLowerCase() ?? null
    case 'createdAt': return row.createdAt
    case 'gemsPurchasedTotal': return row.gemsPurchasedTotal
    case 'imperialism': return row.imperialism
    case 'industrialism': return row.industrialism
    case 'isolationism': return row.isolationism
    case 'leaderName': return row.leaderName?.toLowerCase() ?? null
    case 'memberCount': return row.memberCount
    case 'militarism': return row.militarism
    case 'name': return row.name.toLowerCase()
    case 'premiumGiftsTotal': return row.premiumGiftsTotal
    case 'premiumMonthsTotal': return row.premiumMonthsTotal
    case 'totalPoints': return row.totalPoints
    default: return row.totalPoints
  }
}

/**
 * Driven by the client DataTable on /parties. Reads from the in-process
 * snapshot cache (warm worker = sub-ms) and applies pagination, sorting, and
 * filtering in memory. Returns `{rows, total}`.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const query = parseQuery(searchParams)
  const { parties } = await getSnapshot()
  const result = applyStructuredQuery(parties, query, partySortValue, partyFieldAliases)
  return Response.json(result)
}
