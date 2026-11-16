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
  pop: 'population',
  companies: 'companyCount',
  employees: 'employeeCount',
  income: 'dailyIncome',
}

const regionSortValue = makeSortValue<RegionRow>()

export const GET = createTableRoute<RegionRow>(
  async () => (await getSnapshot()).regions,
  regionSortValue,
  regionFieldAliases,
)
