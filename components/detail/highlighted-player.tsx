'use client'

import type { MouseEvent, PointerEvent, ReactNode } from 'react'

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
  const [hovered, setHovered] = useState<HighlightedPlayer | null>(null)
  const [pinned, setPinned] = useState<HighlightedPlayer | null>(null)

  return (
    <HighlightedPlayerContext value={{ row: hovered ?? pinned, pinned, set: setHovered, pin: setPinned }}>
      {children}
    </HighlightedPlayerContext>
  )
}

/**
 * The highlighted player's name, for the rank map legend; once pinned, with
 * a button to unpin.
 */
export function HighlightedPlayerName() {
  const { row, pinned, pin } = use(HighlightedPlayerContext)

  return row && (
    <span className="text-foreground ml-2 inline-flex items-center gap-1.5">
      <span className={`size-2.5 ${DOT}`} />
      {row.username}
      {row.id === pinned?.id && (
        <button
          type="button"
          aria-label="Unpin"
          className="text-muted-foreground hover:text-foreground -my-1 px-1"
          onClick={() => pin(null)}
        >
          ×
        </button>
      )}
    </span>
  )
}

/**
 * The members as ticks on a `stat` track. Pointing at a tick highlights the
 * nearest member and clicking pins them, until clicked again; a highlighted
 * member gets a white dot and the ticks fade.
 */
export function MemberTicks({ stat, members, color }: { stat: PlayerStat, members: MemberSpots[], color: string }) {
  const { row, pinned, set, pin } = use(HighlightedPlayerContext)
  const highlighted = row && members.find(m => m.id === row.id)?.spots[stat]
  // Overlapping ticks add up, so dense spots read brighter; big groups get
  // fainter ticks so they don't turn into a solid bar.
  const alpha = members.length > 60 ? 0.12 : 0.7

  function nearest(e: MouseEvent<HTMLDivElement>) {
    const box = e.currentTarget.getBoundingClientRect()
    const at = ((e.clientX - box.left) / box.width) * 100
    let found: MemberSpots | null = null
    let distance = (PICK_RADIUS / box.width) * 100
    for (const m of members) {
      const spot = m.spots[stat]
      if (spot != null && Math.abs(spot - at) <= distance) {
        found = m
        distance = Math.abs(spot - at)
      }
    }

    return found
  }

  function hover(e: PointerEvent<HTMLDivElement>) {
    const m = nearest(e)
    if (m?.id !== row?.id) {
      set(m)
    }
  }

  function click(e: MouseEvent<HTMLDivElement>) {
    const m = nearest(e)
    if (m) {
      pin(m.id === pinned?.id ? null : m)
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
      <div
        className="absolute inset-0 z-20 cursor-pointer"
        onPointerMove={hover}
        onPointerLeave={() => set(null)}
        onClick={click}
      />
    </>
  )
}
