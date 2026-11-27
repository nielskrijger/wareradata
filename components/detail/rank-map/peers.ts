import type { Peer } from './peer-ticks'
import type { RankMapGroup, RankMapRow } from './rank-map'
import { valuePosition } from './scale'

/**
 * The whole ranked set, this one included.
 */
export interface Peers {
  selfId: string
  all: { id: string, name: string, code: string | null, groups: RankMapGroup[] }[]
}

export const rowKey = (g: RankMapGroup, r: RankMapRow) => `${g.title}/${r.label}`

/**
 * Every row's peer ticks, keyed by {@link rowKey}, leaving out the unranked
 * and those at zero; with the names of only the peers a tick names.
 */
export function peerRows({ selfId, all }: Peers, groups: RankMapGroup[]) {
  const values = new Map<string, PeerValue[]>()
  all.forEach((p, peer) => {
    if (p.id === selfId) {
      return
    }

    for (const g of p.groups) {
      for (const r of g.rows) {
        if (r.rank != null && r.value != null && r.value !== 0) {
          const key = rowKey(g, r)
          const row = values.get(key) ?? values.set(key, []).get(key)!
          row.push({ peer, value: r.value, rank: r.rank })
        }
      }
    }
  })

  const names: Peer[] = []
  const named = new Map<number, number>()
  const name = (peer: number) => {
    if (!named.has(peer)) {
      named.set(peer, names.push({ name: all[peer].name, code: all[peer].code }) - 1)
    }

    return named.get(peer)!
  }

  const rows = new Map<string, PeerRow>()
  for (const g of groups) {
    for (const r of g.rows) {
      const key = rowKey(g, r)
      const others = values.get(key) ?? []
      const best = Math.max(0, ...others.map(p => p.value))
      const max = Math.max(best, r.value ?? 0)
      const ticks = peerTicks(others, max).map(([at, peer, rank, count]): PeerTick => [at, name(peer), rank, count])
      rows.set(key, { ticks, max, best })
    }
  }

  return { names, rows, count: all.length - 1 }
}

export interface PeerRow {
  ticks: PeerTick[]

  /**
   * The #1's value, the end of the track.
   */
  max: number

  /**
   * The best of the others, for how far the #1 leads.
   */
  best: number
}

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
