import type { FieldAliases } from '@/lib/query'
import type { UserRow } from '@/lib/rows'

import { getSnapshot } from '@/lib/cache/memory'
import { createTableRoute, makeSortValue } from '@/lib/query'
import { TIER_INDEX } from '@/lib/warera/api'

/**
 * Friendly field names for the advanced filter. Underlying row keys still
 * work — these just give a nicer DX (`country:nl` instead of `countryCode:nl`).
 * Keep in sync with the popover cheatsheet in `users-table.tsx`.
 */
const userFieldAliases: FieldAliases = {
  country: 'countryCode',
  mu: 'muName',
  party: 'partyName',
  rank: 'levelRank',
  lastSeen: 'lastConnectionAt',
  joined: 'createdAt',
  ppd: 'pointsPerDay',
  health: 'healthPercent',
  hunger: 'hungerPercent',
  status: 'readinessStatus',
}

const userSortValue = makeSortValue<UserRow>({
  passthrough: [
    'countryCode',
    'level',
    'levelRank',
    'wealthRank',
    'wealth',
    'damageRank',
    'damage',
    'weeklyDamage',
    'bounty',
    'terrain',
    'referrals',
    'premiumMonths',
    'premiumGifts',
    'casesOpened',
    'gemsPurchased',
    'militaryRank',
    'lastConnectionAt',
    'createdAt',
    'points',
    'pointsPerDay',
    'healthPercent',
    'hungerPercent',
    'readinessStatus',
    'gearScore',
    'warShare',
  ],
  text: ['username', 'muName', 'partyName'],
  boolean: ['isBanned'],
  custom: { levelTier: row => (row.levelTier ? TIER_INDEX[row.levelTier] : null) },
  default: 'levelRank',
})

/**
 * Driven by the client DataTable on /users. Reads from the in-process snapshot
 * cache (warm worker = sub-ms) and applies pagination, sorting, and filtering
 * in memory. Returns `{rows, total}`.
 */
export const GET = createTableRoute<UserRow>(
  async () => (await getSnapshot()).users,
  userSortValue,
  userFieldAliases,
)
