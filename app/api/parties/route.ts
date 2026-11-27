import type { FieldAliases } from '@/lib/query'
import type { PartyRow } from '@/lib/rows'

import { getSnapshot } from '@/lib/cache/memory'
import { createTableRoute } from '@/lib/query'
import { GROUP_FIELD_ALIASES } from '@/lib/rows/field-bundles'

/**
 * Friendly field names for the advanced filter. Keep in sync with the
 * popover cheatsheet in `parties-table.tsx`.
 */
const partyFieldAliases: FieldAliases = {
  ...GROUP_FIELD_ALIASES,
  country: 'countryCode',
  leader: 'leaderName',
  members: 'memberCount',
  avg: 'avgPoints',
  level: 'avgLevel',
}

export const GET = createTableRoute<PartyRow>(
  async () => (await getSnapshot()).parties,
  { aliases: partyFieldAliases },
)
