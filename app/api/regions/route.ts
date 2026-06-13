import type { FieldAliases } from '@/lib/query'
import type { RegionRow } from '@/lib/rows'

import { getSnapshot } from '@/lib/cache/memory'
import { createTableRoute, makeSortValue } from '@/lib/query'

/**
 * Friendly field names for the advanced filter. Keep in sync with the
 * popover cheatsheet in `regions-table.tsx`.
 */
const regionFieldAliases: FieldAliases = {
  country: 'countryCode',
  core: 'coreCountryCode',
  resource: 'strategicResource',
  city: 'mainCity',
  capital: 'isCapital',
  dev: 'development',
  neighbors: 'neighborCount',
}

const regionSortValue = makeSortValue<RegionRow>({
  passthrough: ['development', 'neighborCount', 'biome', 'climate', 'strategicResource'],
  text: ['name', 'countryName', 'coreCountryName', 'mainCity'],
  boolean: ['isCapital', 'isLinkedToCapital'],
  default: 'development',
})

/**
 * Driven by the client DataTable on /regions. Reads from the in-process snapshot
 * cache (warm worker = sub-ms) and applies pagination, sorting, and filtering
 * in memory. Returns `{rows, total}`.
 */
export const GET = createTableRoute<RegionRow>(
  async () => (await getSnapshot()).regions,
  regionSortValue,
  regionFieldAliases,
)
