import type { CustomSorts, FieldAliases } from '@/lib/query'
import type { UserRow } from '@/lib/rows'

import { getSnapshot } from '@/lib/cache/memory'
import { createTableRoute } from '@/lib/query'
import {
  CASE_FIELD_ALIASES,
  FACTORY_FIELD_ALIASES,
  WEALTH_FIELD_ALIASES,
} from '@/lib/rows/field-bundles'
import { tierIndex } from '@/lib/warera/api'

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
  buff: 'buffStatus',
}

const userSorts: CustomSorts<UserRow> = {
  levelTier: row => tierIndex(row.levelTier),
  buffStatus: buffSortValue,
}

/**
 * Buff column order: buffs positive, ready 0, debuffs negative, each scaled by
 * its end time so the longest-running effect sits at the extreme.
 *
 * The absolute end time orders the same as time remaining, and keeps the
 * comparator off the clock so one sort stays consistent.
 */
function buffSortValue(row: UserRow): number | null {
  if (row.buffStatus == null) {
    return null
  }

  if (row.buffStatus === 'neither') {
    return 0
  }

  const endsAt = row.buffEndsAt ? Date.parse(row.buffEndsAt) : Number.NaN
  const magnitude = Number.isNaN(endsAt) ? 1 : endsAt

  return row.buffStatus === 'buff' ? magnitude : -magnitude
}

export const GET = createTableRoute<UserRow>(
  async () => (await getSnapshot()).users,
  { aliases: userFieldAliases, sorts: userSorts },
)
