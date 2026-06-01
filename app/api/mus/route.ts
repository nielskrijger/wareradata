import type { FieldAliases } from '@/lib/query'
import type { MURow } from '@/lib/rows'

import { getSnapshot } from '@/lib/cache/memory'
import { createTableRoute, makeSortValue } from '@/lib/query'
import { readinessScore } from '@/lib/rows'
import { TIER_INDEX } from '@/lib/warera/api'

/**
 * Friendly field names for the advanced filter. Keep in sync with the
 * popover cheatsheet in `mus-table.tsx`.
 */
const muFieldAliases: FieldAliases = {
  country: 'countryCode',
  region: 'regionName',
  members: 'memberCount',
  invested: 'investedMoney',
  dorms: 'dormitoriesLevel',
  hq: 'headquartersLevel',
  gems: 'gemsPurchasedTotal',
  premiumMonths: 'premiumMonthsTotal',
  premiumGifts: 'premiumGiftsTotal',
  level: 'avgLevel',
}

const muSortValue = makeSortValue<MURow>({
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
    'bounty',
    'wealth',
    'wealthRank',
    'terrain',
    'reputation',
    'memberCount',
    'investedMoney',
    'dormitoriesLevel',
    'headquartersLevel',
    'gemsPurchasedTotal',
    'premiumMonthsTotal',
    'premiumGiftsTotal',
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
