'use client'

import type { MouseEvent, PointerEvent, ReactNode } from 'react'

import type { HighlightedPlayer } from './highlighted-player-context'
import type { MemberRanks, PlayerStat } from '@/lib/rank-scale'

import { useQueryState } from 'nuqs'
import { use, useEffect, useState } from 'react'

import { UserHoverCard } from '@/components/user-hover-card'
import { formatRank, topPercent } from '@/lib/format'
import { memberTicks, rankPosition } from '@/lib/rank-scale'

import { HighlightedPlayerContext } from './highlighted-player-context'

const DOT = 'ring-card rounded-full bg-white ring-2'

/**
 * A hovered player's mark: a white tick, so it reads as one of the member
 * ticks and leaves the dot to the pinned player.
 */
const MARKER = 'w-0.5 rounded-full bg-white'

/**
 * How far from a tick, in pixels, the pointer still picks it.
 */
const PICK_RADIUS = 8

export function HighlightedPlayerProvider({ children }: { children: ReactNode }) {
  const [hovered, setHovered] = useState<HighlightedPlayer | null>(null)
  const [pinned, setPinned] = useQueryState('player', { history: 'push', scroll: false })

  // A click anywhere but the ticks and the legend name releases the pin.
  useEffect(() => {
    if (!pinned) {
      return
    }

    function release(e: globalThis.MouseEvent) {
      if (!(e.target as Element).closest('[data-keeps-pin]')) {
        void setPinned(null)
      }
    }

    document.addEventListener('click', release)

    return () => document.removeEventListener('click', release)
  }, [pinned, setPinned])

  // Skips a pin that changes nothing, so it doesn't add a history entry.
  const pin = (id: string | null) => id !== pinned && void setPinned(id)

  return (
    <HighlightedPlayerContext value={{ id: hovered?.id ?? pinned, hovered, pinned, set: setHovered, pin }}>
      {children}
    </HighlightedPlayerContext>
  )
}

/**
 * The pinned player's name with their player card and a button to unpin,
 * then the hovered player's, for the rank map legend.
 */
export function HighlightedPlayerName({ members }: { members: MemberRanks[] }) {
  const { hovered, pinned, pin } = use(HighlightedPlayerContext)
  const pinnedName = members.find(m => m.id === pinned)?.username
  const peek = hovered && hovered.id !== pinned ? hovered : null

  return (
    <>
      {pinned != null && pinnedName != null && (
        <span className="text-foreground ml-2 inline-flex items-center gap-1.5" data-keeps-pin>
          <span className={`size-2.5 ${DOT}`} />
          <UserHoverCard userId={pinned}>
            <span className="cursor-default underline decoration-dotted underline-offset-2">{pinnedName}</span>
          </UserHoverCard>
          <button
            type="button"
            aria-label="Unpin"
            className="text-muted-foreground hover:text-foreground -my-1 px-1"
            onClick={() => pin(null)}
          >
            ×
          </button>
        </span>
      )}
      {peek && (
        <span className="text-foreground ml-2 inline-flex items-center gap-1.5">
          <span className={`h-3 ${MARKER}`} />
          {peek.username}
        </span>
      )}
    </>
  )
}

/**
 * The members as ticks on a `stat` track. Pointing at a tick highlights the
 * nearest member with a white tick and labels their rank here; clicking pins
 * them as a white dot, and clicking anywhere else releases. While anyone is
 * highlighted, the other ticks fade.
 */
export function MemberTicks({ stat, members, players, color }: MemberTicksProps) {
  const { id, hovered, pinned, set, pin } = use(HighlightedPlayerContext)
  const pinnedMember = members.find(m => m.id === pinned)
  const peek = hovered && hovered.id !== pinned ? members.find(m => m.id === hovered.id) : undefined
  // The label goes with the tick under the pointer, else the pin.
  const labelled = peek ?? pinnedMember
  const rank = labelled?.ranks[stat]
  // Overlapping ticks add up, so dense spots read brighter; big groups get
  // fainter ticks so they don't turn into a solid bar.
  const alpha = members.length > 60 ? 0.12 : 0.7

  function position(m: MemberRanks | undefined) {
    const r = m?.ranks[stat]

    return r == null ? null : rankPosition(r, players)
  }

  function nearest(e: MouseEvent<HTMLDivElement>) {
    const box = e.currentTarget.getBoundingClientRect()
    const pointer = ((e.clientX - box.left) / box.width) * 100
    let found: MemberRanks | null = null
    let distance = (PICK_RADIUS / box.width) * 100
    for (const m of members) {
      const pos = position(m)
      if (pos != null && Math.abs(pos - pointer) <= distance) {
        found = m
        distance = Math.abs(pos - pointer)
      }
    }

    return found
  }

  function hover(e: PointerEvent<HTMLDivElement>) {
    const m = nearest(e)
    if (m?.id !== hovered?.id) {
      set(m)
    }
  }

  function click(e: MouseEvent<HTMLDivElement>) {
    pin(nearest(e)?.id ?? null)
  }

  return (
    <div className="group absolute inset-0">
      <svg
        className={`absolute inset-0 size-full transition-opacity duration-150 ${id ? 'opacity-25' : ''}`}
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
      {position(pinnedMember) != null && (
        <div
          className={`absolute top-1/2 z-10 size-3 -translate-x-1/2 -translate-y-1/2 ${DOT}`}
          style={{ left: `${position(pinnedMember)}%` }}
        />
      )}
      {position(peek) != null && (
        <div className={`absolute top-0 z-10 h-4 -translate-x-1/2 ${MARKER}`} style={{ left: `${position(peek)}%` }} />
      )}
      {/* Only on the track under the pointer. */}
      {labelled && rank != null && (
        <div
          className={`bg-card pointer-events-none absolute bottom-full z-30 mb-1 hidden -translate-x-1/2 rounded
            border px-1.5 py-0.5 text-[10px] whitespace-nowrap shadow group-hover:block`}
          style={{ left: `${rankPosition(rank, players)}%` }}
        >
          {labelled.username}
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
        data-keeps-pin
        onPointerMove={hover}
        onPointerLeave={() => set(null)}
        onClick={click}
      />
    </div>
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
