import type { CustomSorts, FieldAliases } from '@/lib/query'
import type { AllianceRow } from '@/lib/rows'

import { getSnapshot } from '@/lib/cache/memory'
import { createTableRoute } from '@/lib/query'
import { buffScore } from '@/lib/rows'
import { GROUP_FIELD_ALIASES } from '@/lib/rows/field-bundles'
import { tierIndex } from '@/lib/warera/api'

/**
 * Friendly filter names; keep in sync with the cheatsheet in `alliances-table.tsx`.
 * `country` matches the member names and codes, so `country:nl` finds its alliance.
 */
const allianceFieldAliases: FieldAliases = {
  ...GROUP_FIELD_ALIASES,
  country: 'memberNames',
  dev: 'development',
  founded: 'createdAt',
  health: 'avgHealth',
  hunger: 'avgHunger',
  leader: 'leaderName',
  members: 'memberCount',
  wealth: 'citizenWealth',
  weekly: 'weeklyDamage',
}

const allianceSorts: CustomSorts<AllianceRow> = {
  developmentTier: row => tierIndex(row.developmentTier),
  damageTier: row => tierIndex(row.damageTier),
  buffScore: row => buffScore(row.buffMix),
}

export const GET = createTableRoute<AllianceRow>(
  async () => (await getSnapshot()).alliances,
  { aliases: allianceFieldAliases, sorts: allianceSorts },
)
