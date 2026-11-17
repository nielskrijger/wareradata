import type { FieldAliases } from '@/lib/query'
import type { CountryRow } from '@/lib/rows'

import { withActiveBattleCounts } from '@/lib/cache/live-battles'
import { getSnapshot } from '@/lib/cache/memory'
import { createTableRoute, makeSortValue } from '@/lib/query'
import { buffScore } from '@/lib/rows'
import {
  CASE_FIELD_ALIASES,
  FACTORY_FIELD_ALIASES,
  PREMIUM_FIELD_ALIASES,
  WEALTH_FIELD_ALIASES,
} from '@/lib/rows/field-bundles'
import { TIER_INDEX } from '@/lib/warera/api'

/**
 * Friendly field names for the advanced filter. Keep in sync with the
 * popover cheatsheet in `countries-table.tsx`.
 */
const countryFieldAliases: FieldAliases = {
  ...CASE_FIELD_ALIASES,
  ...WEALTH_FIELD_ALIASES,
  ...PREMIUM_FIELD_ALIASES,
  ...FACTORY_FIELD_ALIASES,
  cases: 'casesOpenedTotal',
  gov: 'govType',
  income: 'dailyIncome',
  allies: 'alliesCount',
  health: 'avgHealth',
  hunger: 'avgHunger',
  level: 'avgLevel',
  points: 'totalPoints',
  ppd: 'avgPointsPerDay',
  population: 'activePopulation',
  rank: 'damageRank',
  treasury: 'money',
  unrest: 'unrestPercent',
  wars: 'warsCount',
}

const countrySortValue = makeSortValue<CountryRow>({
  damageTier: row => (row.damageTier ? TIER_INDEX[row.damageTier] : null),
  buffScore: row => buffScore(row.buffMix),
})

/**
 * Stamps on the live battle counts behind the name cell's ⚔ pill.
 */
export const GET = createTableRoute<CountryRow>(
  async () => withActiveBattleCounts((await getSnapshot()).countries),
  countrySortValue,
  countryFieldAliases,
)
