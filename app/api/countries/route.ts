import type { CountryRow } from '@/lib/rows'

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
function countryHaystack(row: CountryRow): string {
  return `${row.name} ${row.code}`.toLowerCase()
}

/**
 * Maps a column id from the client to a comparable value on the row.
 */
function countrySortValue(row: CountryRow, sort: string): number | string | null {
  switch (sort) {
    case 'name': return row.name.toLowerCase()
    case 'code': return row.code
    case 'damageRank': return row.damageRank
    case 'damageValue': return row.damageValue
    case 'damageTier': return row.damageTier ? tierIndex[row.damageTier] : null
    case 'weeklyDamageValue': return row.weeklyDamageValue
    case 'wealthRank': return row.wealthRank
    case 'wealthValue': return row.wealthValue
    case 'development': return row.development
    case 'activePopulation': return row.activePopulation
    default: return row.damageRank
  }
}

/**
 * Driven by the client DataTable on /countries. Reads from the in-process
 * snapshot cache (warm worker = sub-ms) and applies pagination, sorting, and
 * filtering in memory. Returns `{rows, total}`.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const query = parseQuery(searchParams)
  const { countries } = await getSnapshot()
  const result = applyQuery(countries, query, countryHaystack, countrySortValue)
  return Response.json(result)
}
