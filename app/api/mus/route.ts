import type { FieldAliases } from '@/lib/query'
import type { MURow } from '@/lib/rows'

import { getSnapshot } from '@/lib/cache/memory'
import { applyStructuredQuery, parseQuery } from '@/lib/query'
import { RANKING_TIERS } from '@/lib/warera/api'

/**
 * Tier rank lookup so sorting follows progression
 * (bronze → master), not alphabetical order.
 */
const tierIndex: Record<string, number> = Object.fromEntries(
  RANKING_TIERS.map((t, i) => [t, i]),
)

export const dynamic = 'force-dynamic'

/**
 * Friendly field names for the advanced filter. Keep in sync with the
 * popover cheatsheet in `mus-table.tsx`.
 */
const muFieldAliases: FieldAliases = {
  country: 'countryCode',
  region: 'regionName',
  members: 'memberCount',
  invested: 'investedMoney',
  dorms: 'dormitoriesLevel',
  hq: 'headquartersLevel',
  gems: 'gemsPurchasedTotal',
  premiumMonths: 'premiumMonthsTotal',
  premiumGifts: 'premiumGiftsTotal',
  level: 'avgLevel',
}

/**
 * Maps a column id from the client to a comparable value on the row.
 */
function muSortValue(row: MURow, sort: string): number | string | null {
  switch (sort) {
    case 'avgHealth': return row.avgHealth
    case 'avgHunger': return row.avgHunger
    case 'avgLevel': return row.avgLevel
    case 'avgPoints': return row.avgPoints
    case 'bounty': return row.bounty
    case 'countryName': return row.countryName?.toLowerCase() ?? null
    case 'damageRank': return row.damageRank
    case 'damageTier': return row.damageTier ? tierIndex[row.damageTier] : null
    case 'damage': return row.damage
    case 'dormitoriesLevel': return row.dormitoriesLevel
    case 'gemsPurchasedTotal': return row.gemsPurchasedTotal
    case 'headquartersLevel': return row.headquartersLevel
    case 'investedMoney': return row.investedMoney
    case 'memberCount': return row.memberCount
    case 'name': return row.name.toLowerCase()
    case 'premiumGiftsTotal': return row.premiumGiftsTotal
    case 'premiumMonthsTotal': return row.premiumMonthsTotal
    case 'regionName': return row.regionName?.toLowerCase() ?? null
    case 'reputation': return row.reputation
    case 'terrain': return row.terrain
    case 'totalPoints': return row.totalPoints
    case 'wealthRank': return row.wealthRank
    case 'wealth': return row.wealth
    case 'weeklyDamage': return row.weeklyDamage
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
  const result = applyStructuredQuery(mus, query, muSortValue, muFieldAliases)
  return Response.json(result)
}
