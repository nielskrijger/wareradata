import type { MURow } from '@/lib/rows'

import { getSnapshot } from '@/lib/cache/memory'
import { applyQuery, parseQuery } from '@/lib/query'
import { RANKING_TIERS } from '@/lib/warera/schemas'

/**
 * Tier rank lookup so sorting follows progression
 * (bronze → master), not alphabetical order.
 */
const tierIndex: Record<string, number> = Object.fromEntries(
  RANKING_TIERS.map((t, i) => [t, i]),
)

export const dynamic = 'force-dynamic'

/**
 * Lowercased blob the global filter substring matches against.
 */
function muHaystack(row: MURow): string {
  return `${row.name} ${row.countryName ?? ''} ${row.countryCode ?? ''} ${row.regionName ?? ''}`.toLowerCase()
}

/**
 * Maps a column id from the client to a comparable value on the row.
 */
function muSortValue(row: MURow, sort: string): number | string | null {
  switch (sort) {
    case 'avgPoints': return row.avgPoints
    case 'bountyValue': return row.bountyValue
    case 'countryName': return row.countryName?.toLowerCase() ?? null
    case 'damageRank': return row.damageRank
    case 'damageTier': return row.damageTier ? tierIndex[row.damageTier] : null
    case 'damageValue': return row.damageValue
    case 'dormitoriesLevel': return row.dormitoriesLevel
    case 'headquartersLevel': return row.headquartersLevel
    case 'investedMoney': return row.investedMoney
    case 'memberCount': return row.memberCount
    case 'mercenaryReputation': return row.mercenaryReputation
    case 'name': return row.name.toLowerCase()
    case 'regionName': return row.regionName?.toLowerCase() ?? null
    case 'reputationValue': return row.reputationValue
    case 'terrainValue': return row.terrainValue
    case 'totalPoints': return row.totalPoints
    case 'wealthRank': return row.wealthRank
    case 'wealthValue': return row.wealthValue
    case 'weeklyDamageValue': return row.weeklyDamageValue
    default: return row.totalPoints
  }
}

/**
 * Driven by the client DataTable on /mus. Reads from the in-process
 * snapshot cache (warm worker = sub-ms) and applies pagination, sorting, and
 * filtering in memory. Returns `{rows, total}`.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const query = parseQuery(searchParams)
  const { mus } = await getSnapshot()
  const result = applyQuery(mus, query, muHaystack, muSortValue)
  return Response.json(result)
}
