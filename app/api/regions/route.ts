import type { FieldAliases } from '@/lib/query'
import type { RegionRow } from '@/lib/rows'

import { getSnapshot } from '@/lib/cache/memory'
import { applyStructuredQuery, parseQuery } from '@/lib/query'

export const dynamic = 'force-dynamic'

/**
 * Friendly field names for the advanced filter. Keep in sync with the
 * popover cheatsheet in `regions-table.tsx`.
 */
const regionFieldAliases: FieldAliases = {
  country: 'countryCode',
  resource: 'strategicResource',
  city: 'mainCity',
  capital: 'isCapital',
  dev: 'development',
  neighbors: 'neighborCount',
}

/**
 * Maps a column id from the client to a comparable value on the row.
 */
function regionSortValue(row: RegionRow, sort: string): number | string | null {
  switch (sort) {
    case 'baseDevelopment': return row.baseDevelopment
    case 'biome': return row.biome
    case 'climate': return row.climate
    case 'countryName': return row.countryName?.toLowerCase() ?? null
    case 'development': return row.development
    case 'isCapital': return row.isCapital ? 1 : 0
    case 'isLinkedToCapital': return row.isLinkedToCapital ? 1 : 0
    case 'mainCity': return row.mainCity?.toLowerCase() ?? null
    case 'name': return row.name.toLowerCase()
    case 'neighborCount': return row.neighborCount
    case 'strategicResource': return row.strategicResource
    default: return row.development
  }
}

/**
 * Driven by the client DataTable on /regions. Reads from the in-process
 * snapshot cache (warm worker = sub-ms) and applies pagination, sorting, and
 * filtering in memory. Returns `{rows, total}`.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const query = parseQuery(searchParams)
  const { regions } = await getSnapshot()
  const result = applyStructuredQuery(regions, query, regionSortValue, regionFieldAliases)
  return Response.json(result)
}
