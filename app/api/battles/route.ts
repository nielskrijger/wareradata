import type { CustomSorts, FieldAliases } from '@/lib/query'
import type { BattleRow } from '@/lib/rows'

import { getLiveActiveBattles } from '@/lib/cache/live-battles'
import { getSnapshot } from '@/lib/cache/memory'
import { createTableRoute } from '@/lib/query'

/**
 * Friendly field names for the advanced filter. Keep in sync with the
 * popover cheatsheet in `battles-table.tsx`.
 */
const battleFieldAliases: FieldAliases = {
  attacker: 'attackerName',
  defender: 'defenderName',
  region: 'regionName',
  damage: 'totalDamage',
  pool: 'moneyPool',
}

const battleSorts: CustomSorts<BattleRow> = {
  // The Type column: tournament, then resistance, then regular.
  isResistance: row => (row.isTournament ? 2 : row.isResistance ? 1 : 0),
  // The Winner column, by the winning side's name.
  wonBy: row => (row.wonBy ? row[`${row.wonBy}Name`]?.toLowerCase() ?? null : null),
}

/**
 * Active battles come from the live 60s source and finished ones from the
 * snapshot; each tab's `isActive` base filter picks its set.
 */
export const GET = createTableRoute<BattleRow>(
  async () => {
    const [{ battles }, liveActive] = await Promise.all([getSnapshot(), getLiveActiveBattles()])

    return [...liveActive, ...battles.filter(b => !b.isActive)]
  },
  { aliases: battleFieldAliases, sorts: battleSorts },
)
