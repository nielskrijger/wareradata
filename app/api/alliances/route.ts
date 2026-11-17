import type { FieldAliases } from '@/lib/query'
import type { AllianceRow } from '@/lib/rows'

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
 * Friendly filter names; keep in sync with the cheatsheet in `alliances-table.tsx`.
 * `country` matches the member names and codes, so `country:nl` finds its alliance.
 */
const allianceFieldAliases: FieldAliases = {
  ...CASE_FIELD_ALIASES,
  ...WEALTH_FIELD_ALIASES,
  ...PREMIUM_FIELD_ALIASES,
  ...FACTORY_FIELD_ALIASES,
  cases: 'casesOpenedTotal',
  country: 'memberNames',
  dev: 'development',
  founded: 'createdAt',
  health: 'avgHealth',
  hunger: 'avgHunger',
  leader: 'leaderName',
  members: 'memberCount',
  points: 'totalPoints',
  ppd: 'avgPointsPerDay',
  wealth: 'citizenWealth',
  weekly: 'weeklyDamage',
}

const allianceSortValue = makeSortValue<AllianceRow>({
  developmentTier: row => (row.developmentTier ? TIER_INDEX[row.developmentTier] : null),
  damageTier: row => (row.damageTier ? TIER_INDEX[row.damageTier] : null),
  buffScore: row => buffScore(row.buffMix),
})

export const GET = createTableRoute<AllianceRow>(
  async () => (await getSnapshot()).alliances,
  allianceSortValue,
  allianceFieldAliases,
)
