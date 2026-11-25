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
 * A member tick: its position on the track and opacity.
 */
export type MemberTick = [at: number, opacity: number]

/**
 * Ticks for each member's rank among players on one stat, merged per quarter
 * percent so a big country stays a few hundred ticks.
 *
 * Overlapping ticks add up like stacked translucent lines, so dense spots
 * read brighter; the per-tick opacity drops for big groups so they don't
 * turn into a solid bar.
 */
export function memberTicks(members: UserRow[], stat: PlayerStat, players: number): MemberTick[] {
  const counts = new Map<number, number>()
  for (const m of members) {
    const value = m[stat]
    const rank = m[`${stat}Rank`] as number | null
    // Everyone at zero shares the last rank; they'd pile up at "last" for nothing.
    if (rank == null || value == null || value === 0) {
      continue
    }

    const at = Math.round(rankPosition(rank, players) * 4) / 4
    counts.set(at, (counts.get(at) ?? 0) + 1)
  }

  const alpha = members.length > 60 ? 0.12 : 0.7

  return [...counts].map(([at, n]) => [at, Math.round((1 - (1 - alpha) ** n) * 100) / 100])
}
