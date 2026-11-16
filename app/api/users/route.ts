import type { FieldAliases } from '@/lib/query'
import type { UserRow } from '@/lib/rows'

import { getSnapshot } from '@/lib/cache/memory'
import { createTableRoute, makeSortValue } from '@/lib/query'
import {
  CASE_FIELD_ALIASES,
  FACTORY_FIELD_ALIASES,
  WEALTH_FIELD_ALIASES,
} from '@/lib/rows/field-bundles'
import { TIER_INDEX } from '@/lib/warera/api'

/**
 * Friendly field names for the advanced filter. Underlying row keys still
 * work — these just give a nicer DX (`country:nl` instead of `countryCode:nl`).
 * Keep in sync with the popover cheatsheet in `users-table.tsx`.
 */
const userFieldAliases: FieldAliases = {
  ...CASE_FIELD_ALIASES,
  ...WEALTH_FIELD_ALIASES,
  ...FACTORY_FIELD_ALIASES,
  factories: 'factoryCount',
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
  levelTier: row => (row.levelTier ? TIER_INDEX[row.levelTier] : null),
  readinessStatus: readinessSortValue,
})

/**
 * Buff column order: buffs positive, ready 0, debuffs negative, each scaled by
 * its end time so the longest-running effect sits at the extreme.
 *
 * The absolute end time orders the same as time remaining, and keeps the
 * comparator off the clock so one sort stays consistent.
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

export const GET = createTableRoute<UserRow>(
  async () => (await getSnapshot()).users,
  userSortValue,
  userFieldAliases,
)
