import type { FieldAliases } from '@/lib/query'
import type { PartyRow } from '@/lib/rows'

import { getSnapshot } from '@/lib/cache/memory'
import { createTableRoute, makeSortValue } from '@/lib/query'

/**
 * Friendly field names for the advanced filter. Keep in sync with the
 * popover cheatsheet in `parties-table.tsx`.
 */
const partyFieldAliases: FieldAliases = {
  country: 'countryCode',
  leader: 'leaderName',
  members: 'memberCount',
  points: 'totalPoints',
  avg: 'avgPoints',
  gems: 'gemsPurchasedTotal',
  premiumMonths: 'premiumMonthsTotal',
  premiumGifts: 'premiumGiftsTotal',
  level: 'avgLevel',
}

const partySortValue = makeSortValue<PartyRow>({
  passthrough: [
    'totalPoints',
    'avgPoints',
    'avgLevel',
    'memberCount',
    'memberWealth',
    'gemsPurchasedTotal',
    'premiumMonthsTotal',
    'premiumGiftsTotal',
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
