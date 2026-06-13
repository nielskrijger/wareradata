import type { FieldAliases } from '@/lib/query'
import type { MURow } from '@/lib/rows'

import { getSnapshot } from '@/lib/cache/memory'
import { createTableRoute, makeSortValue } from '@/lib/query'
import { readinessScore } from '@/lib/rows'
import { CASE_FIELD_ALIASES, CASE_SORT_KEYS, COMBAT_SORT_KEYS, FACTORY_FIELD_ALIASES, FACTORY_SORT_KEYS, PREMIUM_FIELD_ALIASES, PREMIUM_KEYS, WEALTH_FIELD_ALIASES, WEALTH_PART_KEYS } from '@/lib/rows/field-bundles'
import { TIER_INDEX } from '@/lib/warera/api'

/**
 * Friendly field names for the advanced filter. Keep in sync with the
 * popover cheatsheet in `mus-table.tsx`.
 */
const muFieldAliases: FieldAliases = {
  ...CASE_FIELD_ALIASES,
  ...WEALTH_FIELD_ALIASES,
  ...PREMIUM_FIELD_ALIASES,
  ...FACTORY_FIELD_ALIASES,
  cases: 'casesOpenedTotal',
  country: 'countryCode',
  region: 'regionName',
  members: 'memberCount',
  invested: 'investedMoney',
  dorms: 'dormitoriesLevel',
  hq: 'headquartersLevel',
  health: 'avgHealth',
  hunger: 'avgHunger',
  level: 'avgLevel',
  points: 'totalPoints',
  ppd: 'avgPointsPerDay',
}

const muSortValue = makeSortValue<MURow>({
  passthrough: [
    ...CASE_SORT_KEYS,
    ...WEALTH_PART_KEYS,
    ...PREMIUM_KEYS,
    ...FACTORY_SORT_KEYS,
    'totalPoints',
    'avgPoints',
    'avgPointsPerDay',
    'avgLevel',
    'avgHealth',
    'avgHunger',
    'avgGearScore',
    'avgWarShare',
    ...COMBAT_SORT_KEYS,
    'bounty',
    'wealth',
    'wealthRank',
    'memberWealth',
    'terrain',
    'reputation',
    'memberCount',
    'investedMoney',
    'dormitoriesLevel',
    'headquartersLevel',
  ],
  text: ['name', 'countryName', 'regionName'],
  custom: {
    damageTier: row => (row.damageTier ? TIER_INDEX[row.damageTier] : null),
    readinessScore: row => readinessScore(row.readinessPill),
  },
  default: 'totalPoints',
})

/**
 * Driven by the client DataTable on /mus. Reads from the in-process snapshot
 * cache (warm worker = sub-ms) and applies pagination, sorting, and filtering
 * in memory. Returns `{rows, total}`.
 */
export const GET = createTableRoute<MURow>(
  async () => (await getSnapshot()).mus,
  muSortValue,
  muFieldAliases,
)
