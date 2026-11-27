import type { UserRow } from '@/lib/rows'

import { rankPosition } from './scale'

/**
 * A player stat that has a rank among all players (`damage` → `damageRank`).
 */
export type PlayerStat = {
  [K in keyof UserRow]: `${K & string}Rank` extends keyof UserRow ? K : never
}[keyof UserRow]

/**
 * A member's ranks on the stats a rank map shows, leaving out those where
 * they're unranked or at zero; much lighter for the page to ship than their {@link UserRow}.
 */
export interface MemberRanks {
  id: string
  username: string
  ranks: Partial<Record<PlayerStat, number>>
}

export function memberRanks(member: UserRow, stats: PlayerStat[]): MemberRanks {
  const ranks: MemberRanks['ranks'] = {}
  for (const stat of stats) {
    const value = member[stat]
    const rank = member[`${stat}Rank`] as number | null
    // Everyone at zero shares the last rank, which would place them for nothing.
    if (rank != null && value != null && value !== 0) {
      ranks[stat] = rank
    }
  }

  return { id: member.id, username: member.username, ranks }
}

/**
 * Members per quarter percent of the track, so a big country stays a few
 * hundred ticks.
 */
export function memberTicks(members: MemberRanks[], stat: PlayerStat, players: number): Map<number, number> {
  const counts = new Map<number, number>()
  for (const m of members) {
    const rank = m.ranks[stat]
    if (rank != null) {
      const key = Math.round(rankPosition(rank, players) * 4) / 4
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
  }

  return counts
}
