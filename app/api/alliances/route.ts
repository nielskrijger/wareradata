import type { FieldAliases } from '@/lib/query'
import type { AllianceRow } from '@/lib/rows'

import { getSnapshot } from '@/lib/cache/memory'
import { createTableRoute, makeSortValue } from '@/lib/query'
import { readinessScore } from '@/lib/rows'
import { CASE_FIELD_ALIASES, CASE_SORT_KEYS, COMBAT_SORT_KEYS, PREMIUM_FIELD_ALIASES, PREMIUM_KEYS, WEALTH_FIELD_ALIASES, WEALTH_PART_KEYS } from '@/lib/rows/field-bundles'
import { TIER_INDEX } from '@/lib/warera/api'

/**
 * Friendly field names for the advanced filter. Keep in sync with the
 * popover cheatsheet in `alliances-table.tsx`. `country` matches against the
 * concatenated member names + codes, so `country:netherlands` (or `country:nl`)
 * finds the alliances a country belongs to.
 */
const allianceFieldAliases: FieldAliases = {
  ...CASE_FIELD_ALIASES,
  ...WEALTH_FIELD_ALIASES,
  ...PREMIUM_FIELD_ALIASES,
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
  passthrough: [
    ...CASE_SORT_KEYS,
    ...WEALTH_PART_KEYS,
    ...PREMIUM_KEYS,
    'totalPoints',
    'avgPoints',
    'avgPointsPerDay',
    'population',
    'populationRank',
    'development',
    'developmentRank',
    'coreDevelopment',
    'coreDevelopmentRank',
    'averageDevelopment',
    'averageDevelopmentRank',
    ...COMBAT_SORT_KEYS,
    'avgGearScore',
    'avgWarShare',
    'avgHealth',
    'avgHunger',
    'weeklyDamagePerCitizen',
    'memberCount',
    'citizenWealth',
    'createdAt',
  ],
  text: ['name', 'leaderName'],
  custom: {
    developmentTier: row => (row.developmentTier ? TIER_INDEX[row.developmentTier] : null),
    damageTier: row => (row.damageTier ? TIER_INDEX[row.damageTier] : null),
    readinessScore: row => readinessScore(row.readinessPill),
  },
  default: 'totalPoints',
})

/**
 * Driven by the client DataTable on /alliances. Reads from the in-process
 * snapshot cache, then filters, sorts, and paginates in memory.
 */
export const GET = createTableRoute<AllianceRow>(
  async () => (await getSnapshot()).alliances,
  allianceSortValue,
  allianceFieldAliases,
)
