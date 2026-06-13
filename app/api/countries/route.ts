import type { FieldAliases } from '@/lib/query'
import type { CountryRow } from '@/lib/rows'

import { withActiveBattleCounts } from '@/lib/cache/live-battles'
import { getSnapshot } from '@/lib/cache/memory'
import { createTableRoute, makeSortValue } from '@/lib/query'
import { readinessScore } from '@/lib/rows'
import { CASE_FIELD_ALIASES, CASE_SORT_KEYS, COMBAT_SORT_KEYS, PREMIUM_FIELD_ALIASES, PREMIUM_KEYS, WEALTH_FIELD_ALIASES, WEALTH_PART_KEYS } from '@/lib/rows/field-bundles'
import { TIER_INDEX } from '@/lib/warera/api'

/**
 * Friendly field names for the advanced filter. Keep in sync with the
 * popover cheatsheet in `countries-table.tsx`.
 */
const countryFieldAliases: FieldAliases = {
  ...CASE_FIELD_ALIASES,
  ...WEALTH_FIELD_ALIASES,
  ...PREMIUM_FIELD_ALIASES,
  cases: 'casesOpenedTotal',
  allies: 'alliesCount',
  health: 'avgHealth',
  hunger: 'avgHunger',
  level: 'avgLevel',
  points: 'totalPoints',
  ppd: 'avgPointsPerDay',
  population: 'activePopulation',
  rank: 'damageRank',
  specialty: 'specializedItem',
  treasury: 'money',
  unrest: 'unrestPercent',
  wars: 'warsCount',
}

const countrySortValue = makeSortValue<CountryRow>({
  passthrough: [
    ...CASE_SORT_KEYS,
    ...WEALTH_PART_KEYS,
    ...PREMIUM_KEYS,
    'totalPoints',
    'avgPoints',
    'avgPointsPerDay',
    'avgLevel',
    'avgHealth',
    'avgHunger',
    'avgGearScore',
    'avgWarShare',
    ...COMBAT_SORT_KEYS,
    'weeklyDamagePerCitizen',
    'wealth',
    'wealthRank',
    'citizenWealth',
    'bounty',
    'money',
    'development',
    'productionBonus',
    'activePopulation',
    'musCount',
    'partyCount',
    'alliesCount',
    'warsCount',
    'code',
    'specializedItem',
    'taxIncome',
    'taxMarket',
    'taxSelfWork',
    'unrestPercent',
  ],
  text: ['name'],
  custom: {
    damageTier: row => (row.damageTier ? TIER_INDEX[row.damageTier] : null),
    readinessScore: row => readinessScore(row.readinessPill),
  },
  default: 'damageRank',
})

/**
 * Driven by the client DataTable on /countries. Reads from the in-process
 * snapshot cache and stamps on live active-battle counts before filtering,
 * sorting, and paginating in memory. Returns `{rows, total}`.
 */
export const GET = createTableRoute<CountryRow>(
  async () => withActiveBattleCounts((await getSnapshot()).countries),
  countrySortValue,
  countryFieldAliases,
)
