import type { CustomSorts, FieldAliases } from '@/lib/query'
import type { MURow } from '@/lib/rows'

import { getSnapshot } from '@/lib/cache/memory'
import { createTableRoute } from '@/lib/query'
import { buffScore } from '@/lib/rows'
import { GROUP_FIELD_ALIASES } from '@/lib/rows/field-bundles'
import { tierIndex } from '@/lib/warera/api'

/**
 * Friendly field names for the advanced filter. Keep in sync with the
 * popover cheatsheet in `mus-table.tsx`.
 */
const muFieldAliases: FieldAliases = {
  ...GROUP_FIELD_ALIASES,
  country: 'countryCode',
  region: 'regionName',
  members: 'memberCount',
  invested: 'investedMoney',
  dorms: 'dormitoriesLevel',
  hq: 'headquartersLevel',
  health: 'avgHealth',
  hunger: 'avgHunger',
  level: 'avgLevel',
}

const muSorts: CustomSorts<MURow> = {
  damageTier: row => tierIndex(row.damageTier),
  buffScore: row => buffScore(row.buffMix),
}

export const GET = createTableRoute<MURow>(
  async () => (await getSnapshot()).mus,
  { aliases: muFieldAliases, sorts: muSorts },
)
