'use client'

import type { PointerEvent, ReactNode } from 'react'

import type { HighlightedPlayer } from './highlighted-player-context'
import type { MemberSpots, PlayerStat } from '@/lib/rank-scale'

import { use, useState } from 'react'

import { memberTicks } from '@/lib/rank-scale'

import { HighlightedPlayerContext } from './highlighted-player-context'

const DOT = 'ring-card rounded-full bg-white ring-2'

/**
 * How far from a tick, in pixels, the pointer still picks it.
 */
const PICK_RADIUS = 8

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
 * The members as ticks on a `stat` track. Pointing at a tick highlights the
 * nearest member; a highlighted member gets a white dot and the ticks fade.
 */
export function MemberTicks({ stat, members, color }: { stat: PlayerStat, members: MemberSpots[], color: string }) {
  const { row, set } = use(HighlightedPlayerContext)
  const highlighted = row && members.find(m => m.id === row.id)?.spots[stat]
  // Overlapping ticks add up, so dense spots read brighter; big groups get
  // fainter ticks so they don't turn into a solid bar.
  const alpha = members.length > 60 ? 0.12 : 0.7

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

  return (
    <>
      <svg
        className={`absolute inset-0 size-full transition-opacity duration-150 ${row ? 'opacity-25' : ''}`}
        viewBox="0 0 100 16"
        preserveAspectRatio="none"
        aria-hidden
      >
        {[...memberTicks(members, stat)].map(([at, n]) => (
          <line
            key={at}
            x1={at}
            x2={at}
            y1={2}
            y2={14}
            stroke={color}
            strokeOpacity={1 - (1 - alpha) ** n}
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>
      {highlighted != null && (
        <div
          className={`absolute top-1/2 z-10 size-3 -translate-x-1/2 -translate-y-1/2 ${DOT}`}
          style={{ left: `${highlighted}%` }}
        />
      )}
      <div className="absolute inset-0 z-20" onPointerMove={pick} onPointerLeave={() => set(null)} />
    </>
  )
}
