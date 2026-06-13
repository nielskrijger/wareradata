import type { FieldAliases } from '@/lib/query'
import type { PartyRow } from '@/lib/rows'

import { getSnapshot } from '@/lib/cache/memory'
import { createTableRoute, makeSortValue } from '@/lib/query'
import { CASE_FIELD_ALIASES, CASE_SORT_KEYS, PREMIUM_FIELD_ALIASES, PREMIUM_KEYS, WEALTH_FIELD_ALIASES, WEALTH_PART_KEYS } from '@/lib/rows/field-bundles'

/**
 * Friendly field names for the advanced filter. Keep in sync with the
 * popover cheatsheet in `parties-table.tsx`.
 */
const partyFieldAliases: FieldAliases = {
  ...CASE_FIELD_ALIASES,
  ...WEALTH_FIELD_ALIASES,
  ...PREMIUM_FIELD_ALIASES,
  cases: 'casesOpenedTotal',
  country: 'countryCode',
  leader: 'leaderName',
  members: 'memberCount',
  points: 'totalPoints',
  avg: 'avgPoints',
  level: 'avgLevel',
  ppd: 'avgPointsPerDay',
}

const partySortValue = makeSortValue<PartyRow>({
  passthrough: [
    ...CASE_SORT_KEYS,
    ...WEALTH_PART_KEYS,
    ...PREMIUM_KEYS,
    'totalPoints',
    'avgPoints',
    'avgPointsPerDay',
    'avgLevel',
    'memberCount',
    'memberWealth',
    'createdAt',
    'imperialism',
    'industrialism',
    'isolationism',
    'militarism',
  ],
  text: ['name', 'countryName', 'leaderName'],
  default: 'totalPoints',
})

/**
 * Driven by the client DataTable on /parties. Reads from the in-process snapshot
 * cache (warm worker = sub-ms) and applies pagination, sorting, and filtering
 * in memory. Returns `{rows, total}`.
 */
export const GET = createTableRoute<PartyRow>(
  async () => (await getSnapshot()).parties,
  partySortValue,
  partyFieldAliases,
)
