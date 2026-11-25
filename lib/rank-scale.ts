import type { UserRow } from '@/lib/rows'

/**
 * Where a rank sits on a rank track, 0 (last) to 100 (#1).
 *
 * Square root of the share of the set ranked above: the top quarter gets half
 * the track, so the best spread out without the top 1% swallowing it. Being a
 * share, groups and players of different set sizes line up.
 */
export function rankPosition(rank: number, total: number): number {
  return sharePosition((rank - 1) / Math.max(total - 1, 1))
}

function sharePosition(share: number): number {
  return 100 * (1 - Math.sqrt(share))
}

export const RANK_MARKS = [
  { label: 'last', at: 0 },
  { label: 'top 25%', at: sharePosition(0.25) },
  { label: 'top 6%', at: sharePosition(0.0625) },
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
 * A member's spots on a rank map, rounded like the ticks; much lighter for the
 * page to ship than their {@link UserRow}.
 */
export interface MemberSpots {
  id: string
  username: string
  spots: Partial<Record<PlayerStat, number>>
}

export function memberSpots(member: UserRow, stats: PlayerStat[], players: number): MemberSpots {
  const spots: MemberSpots['spots'] = {}
  for (const stat of stats) {
    const at = playerPosition(member, stat, players)
    if (at != null) {
      spots[stat] = Math.round(at * 4) / 4
    }
  }

  return { id: member.id, username: member.username, spots }
}

/**
 * Members per quarter percent of the track, so a big country stays a few
 * hundred ticks.
 */
export function memberTicks(members: MemberSpots[], stat: PlayerStat): Map<number, number> {
  const counts = new Map<number, number>()
  for (const m of members) {
    const at = m.spots[stat]
    if (at != null) {
      counts.set(at, (counts.get(at) ?? 0) + 1)
    }
  }

  return counts
}
