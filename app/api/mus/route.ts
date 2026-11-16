import type { FieldAliases } from '@/lib/query'
import type { MURow } from '@/lib/rows'

import { getSnapshot } from '@/lib/cache/memory'
import { createTableRoute, makeSortValue } from '@/lib/query'
import { readinessScore } from '@/lib/rows'
import {
  CASE_FIELD_ALIASES,
  FACTORY_FIELD_ALIASES,
  PREMIUM_FIELD_ALIASES,
  WEALTH_FIELD_ALIASES,
} from '@/lib/rows/field-bundles'
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
  damageTier: row => (row.damageTier ? TIER_INDEX[row.damageTier] : null),
  readinessScore: row => readinessScore(row.readinessPill),
})

export const GET = createTableRoute<MURow>(
  async () => (await getSnapshot()).mus,
  muSortValue,
  muFieldAliases,
)
