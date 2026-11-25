'use client'

import type { MouseEvent, PointerEvent, ReactNode } from 'react'

import type { HighlightedPlayer } from './highlighted-player-context'
import type { MemberRanks, PlayerStat } from '@/lib/rank-scale'

import { use, useState } from 'react'

import { UserHoverCard } from '@/components/user-hover-card'
import { formatRank, topPercent } from '@/lib/format'
import { memberPosition, memberTicks, rankPosition } from '@/lib/rank-scale'

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
 * The highlighted player's name, for the rank map legend, with their player
 * card on hover; once pinned, with a button to unpin.
 */
export function HighlightedPlayerName() {
  const { row, pinned, pin } = use(HighlightedPlayerContext)

  return row && (
    <span className="text-foreground ml-2 inline-flex items-center gap-1.5">
      <span className={`size-2.5 ${DOT}`} />
      <UserHoverCard userId={row.id}>
        <span className="cursor-default underline decoration-dotted underline-offset-2">{row.username}</span>
      </UserHoverCard>
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
 * nearest member and labels their rank here; clicking pins them, until
 * clicked again. A highlighted member gets a white dot and the ticks fade.
 */
export function MemberTicks({ stat, members, players, color }: MemberTicksProps) {
  const { row, pinned, set, pin } = use(HighlightedPlayerContext)
  const [pointing, setPointing] = useState(false)
  const shown = row && members.find(m => m.id === row.id)
  const rank = shown?.ranks[stat]
  const at = rank == null ? null : rankPosition(rank, players)
  // Overlapping ticks add up, so dense spots read brighter; big groups get
  // fainter ticks so they don't turn into a solid bar.
  const alpha = members.length > 60 ? 0.12 : 0.7

  function nearest(e: MouseEvent<HTMLDivElement>) {
    const box = e.currentTarget.getBoundingClientRect()
    const pointer = ((e.clientX - box.left) / box.width) * 100
    let found: MemberRanks | null = null
    let distance = (PICK_RADIUS / box.width) * 100
    for (const m of members) {
      const pos = memberPosition(m, stat, players)
      if (pos != null && Math.abs(pos - pointer) <= distance) {
        found = m
        distance = Math.abs(pos - pointer)
      }
    }

    return found
  }

  function hover(e: PointerEvent<HTMLDivElement>) {
    setPointing(true)
    const m = nearest(e)
    if (m?.id !== row?.id) {
      set(m)
    }
  }

  function leave() {
    setPointing(false)
    set(null)
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
        {[...memberTicks(members, stat, players)].map(([tick, n]) => (
          <line
            key={tick}
            x1={tick}
            x2={tick}
            y1={2}
            y2={14}
            stroke={color}
            strokeOpacity={1 - (1 - alpha) ** n}
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>
      {at != null && (
        <div
          className={`absolute top-1/2 z-10 size-3 -translate-x-1/2 -translate-y-1/2 ${DOT}`}
          style={{ left: `${at}%` }}
        />
      )}
      {pointing && shown && rank != null && (
        <div
          className={`bg-card pointer-events-none absolute bottom-full z-30 mb-1 -translate-x-1/2 rounded border
            px-1.5 py-0.5 text-[10px] whitespace-nowrap shadow`}
          style={{ left: `${rankPosition(rank, players)}%` }}
        >
          {shown.username}
          <span className="text-muted-foreground">
            {' · '}
            {formatRank(rank)}
            {' · '}
            {topPercent(rank, players)}
          </span>
        </div>
      )}
      <div
        className="absolute inset-0 z-20 cursor-pointer"
        onPointerMove={hover}
        onPointerLeave={leave}
        onClick={click}
      />
    </>
  )
}

interface MemberTicksProps {
  stat: PlayerStat
  members: MemberRanks[]

  /**
   * Size of the player set the ranks are in.
   */
  players: number
  color: string
}
