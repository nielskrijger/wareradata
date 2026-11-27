'use client'

import type { MouseEvent, ReactNode } from 'react'

import type { MemberRanks, PlayerStat } from '@/lib/rank-scale'

import { useQueryState } from 'nuqs'
import { use, useEffect, useState } from 'react'

import { UserHoverCard } from '@/components/user-hover-card'
import { formatRank, topPercent } from '@/lib/format'
import { memberTicks, rankPosition } from '@/lib/rank-scale'

import { HighlightedPlayerContext } from './highlighted-player-context'

const DOT = 'ring-card rounded-full bg-white ring-2'

/**
 * A white tick, so a hovered player reads as one of the member ticks and the
 * dot stays the pinned player's.
 */
const MARKER = 'w-0.5 rounded-full bg-white'

/**
 * How far from a tick, in pixels, the pointer still picks it.
 */
const PICK_RADIUS = 8

export function HighlightedPlayerProvider({ children }: { children: ReactNode }) {
  const [hovered, setHovered] = useState<string | null>(null)
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

  // Skips a pin that changes nothing, so it adds no history entry.
  const pin = (id: string | null) => id !== pinned && void setPinned(id)

  return (
    <HighlightedPlayerContext value={{ hovered, pinned, hover: setHovered, pin }}>
      {children}
    </HighlightedPlayerContext>
  )
}

/**
 * The pinned player, with their player card and a button to unpin, then the
 * hovered one; for the rank map legend.
 */
export function HighlightedPlayerName({ members }: { members: MemberRanks[] }) {
  const { hovered, pinned, pin } = use(HighlightedPlayerContext)
  const pinnedMember = members.find(m => m.id === pinned)
  const hoveredMember = hovered === pinned ? undefined : members.find(m => m.id === hovered)

  return (
    <>
      {pinnedMember && (
        <span className="text-foreground ml-2 inline-flex items-center gap-1.5" data-keeps-pin>
          <span className={`size-2.5 ${DOT}`} />
          <UserHoverCard userId={pinnedMember.id}>
            <span className="cursor-default underline decoration-dotted underline-offset-2">
              {pinnedMember.username}
            </span>
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
      {hoveredMember && (
        <span className="text-foreground ml-2 inline-flex items-center gap-1.5">
          <span className={`h-3 ${MARKER}`} />
          {hoveredMember.username}
        </span>
      )}
    </>
  )
}

/**
 * The members as ticks on a `stat` track. Pointing at a tick marks the
 * nearest member with a white tick and labels their rank; clicking pins them
 * as a white dot. While anyone is highlighted, the other ticks fade.
 */
export function MemberTicks({ stat, members, players, color }: MemberTicksProps) {
  const { hovered, pinned, hover, pin } = use(HighlightedPlayerContext)
  const at = (id: string | null) => {
    const rank = members.find(m => m.id === id)?.ranks[stat]

    return rank == null ? null : rankPosition(rank, players)
  }

  const pinnedAt = at(pinned)
  const hoveredAt = hovered === pinned ? null : at(hovered)
  const labelled = members.find(m => m.id === (hoveredAt == null ? pinned : hovered))
  const rank = labelled?.ranks[stat]
  // Overlapping ticks add up, so dense spots read brighter; big groups get
  // fainter ticks so they don't turn into a solid bar.
  const alpha = members.length > 60 ? 0.12 : 0.7
  const fade = hovered || pinned ? 'opacity-60' : ''

  function nearest(e: MouseEvent<HTMLDivElement>) {
    const box = e.currentTarget.getBoundingClientRect()
    const pointer = ((e.clientX - box.left) / box.width) * 100
    let found: string | null = null
    let distance = (PICK_RADIUS / box.width) * 100
    for (const m of members) {
      const rank = m.ranks[stat]
      const d = rank == null ? Infinity : Math.abs(rankPosition(rank, players) - pointer)
      if (d <= distance) {
        found = m.id
        distance = d
      }
    }

    return found
  }

  return (
    <div className="group absolute inset-0">
      <svg
        className={`absolute inset-0 size-full transition-opacity duration-150 ${fade}`}
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
      {pinnedAt != null && (
        <div
          className={`absolute top-1/2 z-10 size-3 -translate-x-1/2 -translate-y-1/2 ${DOT}`}
          style={{ left: `${pinnedAt}%` }}
        />
      )}
      {hoveredAt != null && (
        <div className={`absolute top-0 z-10 h-4 -translate-x-1/2 ${MARKER}`} style={{ left: `${hoveredAt}%` }} />
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
        onPointerMove={(e) => {
          const id = nearest(e)
          if (id !== hovered) {
            hover(id)
          }
        }}
        onPointerLeave={() => hover(null)}
        onClick={e => pin(nearest(e))}
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
