'use client'

import type { ReactNode } from 'react'

import type { MemberRanks, PlayerStat } from './members'

import { useQueryState } from 'nuqs'
import { use, useEffect, useState } from 'react'

import { UserHoverCard } from '@/components/user-hover-card'
import { formatRank, topPercent } from '@/lib/format'
import { HighlightedPlayerContext } from './highlighted-player-context'
import { memberTicks } from './members'

import { rankPosition } from './scale'
import { LegendMarker, TickLabel, TickMarker, TickTrack } from './tick-track'

const DOT = 'ring-card rounded-full bg-white ring-2'

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
          <LegendMarker />
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
  const spots = members.flatMap((m): [number, string][] => {
    const rank = m.ranks[stat]

    return rank == null ? [] : [[rankPosition(rank, players), m.id]]
  })

  const at = (id: string | null) => spots.find(([, m]) => m === id)?.[0]
  const pinnedAt = at(pinned)
  const hoveredAt = hovered === pinned ? undefined : at(hovered)
  const labelled = members.find(m => m.id === (hoveredAt == null ? pinned : hovered))
  const rank = labelled?.ranks[stat]

  return (
    <TickTrack
      ticks={memberTicks(members, stat, players)}
      // Big groups get fainter ticks so they don't turn into a solid bar.
      alpha={members.length > 60 ? 0.12 : 0.7}
      color={color}
      faded={hovered != null || pinned != null}
      spots={spots}
      hovered={hovered}
      hover={hover}
      pick={pin}
    >
      {pinnedAt != null && (
        <div
          className={`absolute top-1/2 z-10 size-3 -translate-x-1/2 -translate-y-1/2 ${DOT}`}
          style={{ left: `${pinnedAt}%` }}
        />
      )}
      {hoveredAt != null && <TickMarker at={hoveredAt} />}
      {labelled && rank != null && (
        <TickLabel at={rankPosition(rank, players)}>
          {labelled.username}
          <span className="text-muted-foreground">
            {' · '}
            {formatRank(rank)}
            {' · '}
            {topPercent(rank, players)}
          </span>
        </TickLabel>
      )}
    </TickTrack>
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
