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
 * The highlighted player's name, for the rank map legend, with their player
 * card on hover; once pinned, with a button to unpin.
 */
export function HighlightedPlayerName({ members }: { members: MemberRanks[] }) {
  const { id, hovered, pinned, pin } = use(HighlightedPlayerContext)
  const name = hovered?.username ?? members.find(m => m.id === id)?.username

  return id != null && name != null && (
    <span className="text-foreground ml-2 inline-flex items-center gap-1.5" data-keeps-pin>
      <span className={`size-2.5 ${DOT}`} />
      <UserHoverCard userId={id}>
        <span className="cursor-default underline decoration-dotted underline-offset-2">{name}</span>
      </UserHoverCard>
      {id === pinned && (
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
 * nearest member and labels their rank here; clicking pins them, and
 * clicking anywhere else releases. A highlighted member gets a white dot and
 * the ticks fade.
 */
export function MemberTicks({ stat, members, players, color }: MemberTicksProps) {
  const { id, set, pin } = use(HighlightedPlayerContext)
  const shown = id == null ? undefined : members.find(m => m.id === id)
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
      const pos = m.ranks[stat] == null ? null : rankPosition(m.ranks[stat], players)
      if (pos != null && Math.abs(pos - pointer) <= distance) {
        found = m
        distance = Math.abs(pos - pointer)
      }
    }

    return found
  }

  function hover(e: PointerEvent<HTMLDivElement>) {
    const m = nearest(e)
    if (m?.id !== id) {
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
      {at != null && (
        <div
          className={`absolute top-1/2 z-10 size-3 -translate-x-1/2 -translate-y-1/2 ${DOT}`}
          style={{ left: `${at}%` }}
        />
      )}
      {/* Only on the track under the pointer. */}
      {shown && rank != null && (
        <div
          className={`bg-card pointer-events-none absolute bottom-full z-30 mb-1 hidden -translate-x-1/2 rounded
            border px-1.5 py-0.5 text-[10px] whitespace-nowrap shadow group-hover:block`}
          style={{ left: `${at}%` }}
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
