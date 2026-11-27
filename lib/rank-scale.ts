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

/**
 * Where a value sits on a value track, 0 (none) to 100 (`max`, the #1's).
 *
 * Square root of the share of #1's value, like {@link rankPosition}: the
 * leaders spread out without the long tail of small ones collapsing to a dot.
 */
export function valuePosition(value: number, max: number): number {
  return max > 0 ? 100 * Math.sqrt(Math.max(value, 0) / max) : 0
}

/**
 * The share of #1's value at a spot on a value track; {@link valuePosition} undone.
 */
export function valueShare(at: number): number {
  return (at / 100) ** 2
}

export const VALUE_MARKS = [
  { label: '0', at: 0 },
  { label: '10% of #1', at: valuePosition(0.1, 1) },
  { label: '25%', at: valuePosition(0.25, 1) },
  { label: '50%', at: valuePosition(0.5, 1) },
  { label: '#1', at: 100 },
]

/**
 * The peers in one half percent of a value track, named by the best of
 * them (an index into the rank map's peer list). A tuple, as a big set ships
 * thousands of them.
 */
export type PeerTick = [at: number, peer: number, rank: number, count: number]

export interface PeerValue {
  peer: number
  value: number
  rank: number
}

/**
 * Peers per half percent of the value track, so a set of thousands stays
 * under two hundred ticks that each still name someone.
 */
export function peerTicks(values: PeerValue[], max: number): PeerTick[] {
  const ticks = new Map<number, PeerTick>()
  for (const { peer, value, rank } of values) {
    const at = Math.round(valuePosition(value, max) * 2) / 2
    const tick = ticks.get(at)
    if (!tick) {
      ticks.set(at, [at, peer, rank, 1])
    } else {
      tick[3]++
      if (rank < tick[2]) {
        tick[1] = peer
        tick[2] = rank
      }
    }
  }

  return [...ticks.values()]
}
