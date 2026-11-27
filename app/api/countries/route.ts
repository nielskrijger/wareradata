import type { CustomSorts, FieldAliases } from '@/lib/query'
import type { CountryRow } from '@/lib/rows'

import { withActiveBattleCounts } from '@/lib/cache/live-battles'
import { getSnapshot } from '@/lib/cache/memory'
import { createTableRoute } from '@/lib/query'
import { buffScore } from '@/lib/rows'
import { GROUP_FIELD_ALIASES } from '@/lib/rows/field-bundles'
import { tierIndex } from '@/lib/warera/api'

/**
 * Friendly field names for the advanced filter. Keep in sync with the
 * popover cheatsheet in `countries-table.tsx`.
 */
const countryFieldAliases: FieldAliases = {
  ...GROUP_FIELD_ALIASES,
  gov: 'govType',
  income: 'dailyIncome',
  allies: 'alliesCount',
  health: 'avgHealth',
  hunger: 'avgHunger',
  level: 'avgLevel',
  population: 'activePopulation',
  rank: 'damageRank',
  treasury: 'money',
  unrest: 'unrestPercent',
  wars: 'warsCount',
}

const countrySorts: CustomSorts<CountryRow> = {
  damageTier: row => tierIndex(row.damageTier),
  buffScore: row => buffScore(row.buffMix),
}

/**
 * Stamps on the live battle counts behind the name cell's ⚔ pill.
 */
export const GET = createTableRoute<CountryRow>(
  async () => withActiveBattleCounts((await getSnapshot()).countries),
  { aliases: countryFieldAliases, sorts: countrySorts },
)
