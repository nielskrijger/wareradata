import type { FieldAliases } from '@/lib/query'
import type { CountryRow } from '@/lib/rows'

import { withActiveBattleCounts } from '@/lib/cache/live-battles'
import { getSnapshot } from '@/lib/cache/memory'
import { createTableRoute, makeSortValue } from '@/lib/query'
import { readinessScore } from '@/lib/rows'
import { TIER_INDEX } from '@/lib/warera/api'

/**
 * Friendly field names for the advanced filter. Keep in sync with the
 * popover cheatsheet in `countries-table.tsx`.
 */
const countryFieldAliases: FieldAliases = {
  allies: 'alliesCount',
  gems: 'gemsPurchasedTotal',
  level: 'avgLevel',
  population: 'activePopulation',
  premiumGifts: 'premiumGiftsTotal',
  premiumMonths: 'premiumMonthsTotal',
  rank: 'damageRank',
  specialty: 'specializedItem',
  treasury: 'money',
  unrest: 'unrestPercent',
  wars: 'warsCount',
}

const countrySortValue = makeSortValue<CountryRow>({
  passthrough: [
    'totalPoints',
    'avgPoints',
    'avgLevel',
    'avgHealth',
    'avgHunger',
    'avgGearScore',
    'avgWarShare',
    'damage',
    'damageRank',
    'weeklyDamage',
    'weeklyDamagePerCitizen',
    'wealth',
    'wealthRank',
    'bounty',
    'money',
    'development',
    'productionBonus',
    'activePopulation',
    'musCount',
    'partyCount',
    'alliesCount',
    'warsCount',
    'gemsPurchasedTotal',
    'premiumMonthsTotal',
    'premiumGiftsTotal',
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
