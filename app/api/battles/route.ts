import type { FieldAliases } from '@/lib/query'
import type { BattleRow } from '@/lib/rows'

import { getLiveActiveBattles } from '@/lib/cache/live-battles'
import { getSnapshot } from '@/lib/cache/memory'
import { applyStructuredQuery, parseQuery } from '@/lib/query'

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

function battleSortValue(row: BattleRow, sort: string): number | string | null {
  switch (sort) {
    case 'attackerName': return row.attackerName?.toLowerCase() ?? null
    case 'attackerWonRounds': return row.attackerWonRounds
    case 'defenderName': return row.defenderName?.toLowerCase() ?? null
    case 'endedAt': return row.endedAt
    case 'moneyPool': return row.moneyPool
    case 'regionName': return row.regionName?.toLowerCase() ?? null
    case 'roundAttackerDamage': return row.roundAttackerDamage
    case 'roundDefenderDamage': return row.roundDefenderDamage
    case 'totalDamage': return row.totalDamage
    default: return row.totalDamage
  }
}

/**
 * Driven by the client DataTable on /battles. Active battles come from the live
 * 60s-cached source; finished battles from the hourly snapshot. We merge both
 * and let the locked `isActive:<bool>` base filter (per tab) select the right
 * set, so the live active rows replace the snapshot's stale ones.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const query = parseQuery(searchParams)
  const [{ battles }, liveActive] = await Promise.all([getSnapshot(), getLiveActiveBattles()])
  const merged = [...liveActive, ...battles.filter(b => !b.isActive)]
  const result = applyStructuredQuery(merged, query, battleSortValue, battleFieldAliases)
  return Response.json(result)
}
