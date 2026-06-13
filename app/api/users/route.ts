import type { FieldAliases } from '@/lib/query'
import type { UserRow } from '@/lib/rows'

import { getSnapshot } from '@/lib/cache/memory'
import { createTableRoute, makeSortValue } from '@/lib/query'
import { CASE_FIELD_ALIASES, CASE_SORT_KEYS, WEALTH_FIELD_ALIASES, WEALTH_PART_KEYS } from '@/lib/rows/field-bundles'
import { TIER_INDEX } from '@/lib/warera/api'

/**
 * Friendly field names for the advanced filter. Underlying row keys still
 * work — these just give a nicer DX (`country:nl` instead of `countryCode:nl`).
 * Keep in sync with the popover cheatsheet in `users-table.tsx`.
 */
const userFieldAliases: FieldAliases = {
  ...CASE_FIELD_ALIASES,
  ...WEALTH_FIELD_ALIASES,
  cases: 'casesOpened',
  country: 'countryCode',
  mu: 'muName',
  party: 'partyName',
  rank: 'levelRank',
  lastSeen: 'lastConnectionAt',
  joined: 'createdAt',
  ppd: 'pointsPerDay',
  buff: 'readinessStatus',
}

const userSortValue = makeSortValue<UserRow>({
  passthrough: [
    ...CASE_SORT_KEYS,
    ...WEALTH_PART_KEYS,
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
    'health',
    'hunger',
    'gearScore',
    'warShare',
  ],
  text: ['username', 'muName', 'partyName'],
  boolean: ['isBanned'],
  custom: {
    levelTier: row => (row.levelTier ? TIER_INDEX[row.levelTier] : null),
    readinessStatus: readinessSortValue,
  },
  default: 'levelRank',
})

/**
 * Comparable for the Buff column. Orders by the buff/debuff end time so that
 * (sorted descending) the longest-remaining buff is on top, "ready" (no effect)
 * sits in the middle, and the longest-remaining debuff is at the bottom. Buffs
 * sort positive, debuffs negative, ready at zero.
 *
 * Every row is compared against the same instant, so the absolute end timestamp
 * orders identically to the actual time remaining — and using it means the
 * comparator never reads the clock, so the order stays stable across the many
 * comparisons in one sort. A buff/debuff without a known end time falls just off
 * the "ready" midpoint, keeping it on the correct side. A null status returns
 * null, which the shared sorter always pushes last.
 */
function readinessSortValue(row: UserRow): number | null {
  if (row.readinessStatus == null) {
    return null
  }
  if (row.readinessStatus === 'neither') {
    return 0
  }

  const endsAt = row.readinessEndsAt ? Date.parse(row.readinessEndsAt) : Number.NaN
  const magnitude = Number.isNaN(endsAt) ? 1 : endsAt
  return row.readinessStatus === 'buff' ? magnitude : -magnitude
}

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
