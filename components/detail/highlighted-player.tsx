'use client'

import type { PointerEvent, ReactNode } from 'react'

import type { HighlightedPlayer } from './highlighted-player-context'
import type { MemberSpots, PlayerStat } from '@/lib/rank-scale'

import { use, useState } from 'react'

import { playerPosition } from '@/lib/rank-scale'

import { HighlightedPlayerContext, RankMapMembersContext } from './highlighted-player-context'

const DOT = 'ring-card rounded-full bg-white ring-2'

export function HighlightedPlayerProvider({ children }: { children: ReactNode }) {
  const [row, setRow] = useState<HighlightedPlayer | null>(null)

  return <HighlightedPlayerContext value={{ row, set: setRow }}>{children}</HighlightedPlayerContext>
}

/**
 * The highlighted player's name, for the rank map legend.
 */
export function HighlightedPlayerName() {
  const { row } = use(HighlightedPlayerContext)

  return row && (
    <span className="text-foreground ml-2 inline-flex items-center gap-1.5">
      <span className={`size-2.5 ${DOT}`} />
      {row.username}
    </span>
  )
}

/**
 * The highlighted player's own spot on a rank map track.
 */
export function HighlightedPlayerDot({ stat, players }: { stat: PlayerStat, players: number }) {
  const { row } = use(HighlightedPlayerContext)
  const at = row && ('spots' in row ? row.spots[stat] : playerPosition(row, stat, players))

  return at != null && (
    <div
      className={`absolute top-1/2 z-10 size-3 -translate-x-1/2 -translate-y-1/2 ${DOT}`}
      style={{ left: `${at}%` }}
    />
  )
}

/**
 * Fades the member ticks while a player is highlighted, so their dot stands out.
 */
export function HighlightedPlayerFade({ children }: { children: ReactNode }) {
  const { row } = use(HighlightedPlayerContext)

  return (
    <div className={`absolute inset-0 transition-opacity duration-150 ${row ? 'opacity-25' : ''}`}>
      {children}
    </div>
  )
}

export function RankMapMembers({ members, children }: { members: MemberSpots[], children: ReactNode }) {
  return <RankMapMembersContext value={members}>{children}</RankMapMembersContext>
}

/**
 * How far from a tick, in pixels, the pointer still picks it.
 */
const PICK_RADIUS = 8

/**
 * Highlights the member whose tick is nearest the pointer on a `stat` track.
 */
export function HighlightedPlayerPicker({ stat }: { stat: PlayerStat }) {
  const { row, set } = use(HighlightedPlayerContext)
  const members = use(RankMapMembersContext)

  function pick(e: PointerEvent<HTMLDivElement>) {
    const box = e.currentTarget.getBoundingClientRect()
    const at = ((e.clientX - box.left) / box.width) * 100
    let nearest: MemberSpots | null = null
    let distance = (PICK_RADIUS / box.width) * 100
    for (const m of members) {
      const spot = m.spots[stat]
      if (spot != null && Math.abs(spot - at) <= distance) {
        nearest = m
        distance = Math.abs(spot - at)
      }
    }

    if (nearest?.id !== row?.id) {
      set(nearest)
    }
  }

  return <div className="absolute inset-0 z-20" onPointerMove={pick} onPointerLeave={() => set(null)} />
}
