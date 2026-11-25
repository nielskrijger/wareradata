import type { UserRow } from '@/lib/rows'

/**
 * The best share the scale tells apart; anything better sits at #1.
 */
const FLOOR = 0.0005

/**
 * Where a rank sits on a rank track, 0 (last) to 100 (#1).
 *
 * Log in the share of the set ranked above, so the top 1% gets as much room
 * as the top 10% and members of a strong group don't all pile up at the end.
 * Being a share, groups and players of different set sizes line up.
 */
export function rankPosition(rank: number, total: number): number {
  return sharePosition((rank - 1) / total)
}

function sharePosition(share: number): number {
  return 100 * (1 - Math.log(Math.max(share, FLOOR) / FLOOR) / Math.log(1 / FLOOR))
}

export const RANK_MARKS = [
  { label: 'last', at: 0 },
  { label: 'top 10%', at: sharePosition(0.1) },
  { label: 'top 1%', at: sharePosition(0.01) },
  { label: '#1', at: 100 },
]

/**
 * A player stat that has a rank among all players (`damage` → `damageRank`).
 */
export type PlayerStat = {
  [K in keyof UserRow]: `${K & string}Rank` extends keyof UserRow ? K : never
}[keyof UserRow]

/**
 * Where a player sits on `stat`, or null when unranked or at zero (everyone
 * at zero shares the last rank, which would place them for nothing).
 */
export function playerPosition(player: UserRow, stat: PlayerStat, players: number): number | null {
  const value = player[stat]
  const rank = player[`${stat}Rank`] as number | null

  return rank == null || value == null || value === 0 ? null : rankPosition(rank, players)
}

/**
 * Members per quarter percent of the track, so a big country stays a few
 * hundred ticks.
 */
export function memberTicks(members: UserRow[], stat: PlayerStat, players: number): Map<number, number> {
  const counts = new Map<number, number>()
  for (const m of members) {
    const at = playerPosition(m, stat, players)
    if (at != null) {
      const key = Math.round(at * 4) / 4
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
  }

  return counts
}
