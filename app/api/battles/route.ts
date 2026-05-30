import type { FieldAliases } from '@/lib/query'
import type { BattleRow } from '@/lib/rows'

import { getLiveActiveBattles } from '@/lib/cache/live-battles'
import { getSnapshot } from '@/lib/cache/memory'
import { createTableRoute, makeSortValue } from '@/lib/query'

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

const battleSortValue = makeSortValue<BattleRow>({
  passthrough: [
    'totalDamage',
    'moneyPool',
    'attackerWonRounds',
    'roundAttackerDamage',
    'roundDefenderDamage',
    'endedAt',
  ],
  text: ['attackerName', 'defenderName', 'regionName'],
  default: 'totalDamage',
})

/**
 * Driven by the client DataTable on /battles. Active battles come from the live
 * 60s-cached source; finished battles from the hourly snapshot. We merge both
 * and let the locked `isActive:<bool>` base filter (per tab) select the right
 * set, so the live active rows replace the snapshot's stale ones.
 */
export const GET = createTableRoute<BattleRow>(
  async () => {
    const [{ battles }, liveActive] = await Promise.all([getSnapshot(), getLiveActiveBattles()])
    return [...liveActive, ...battles.filter(b => !b.isActive)]
  },
  battleSortValue,
  battleFieldAliases,
)
