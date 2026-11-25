'use client'

import type { ReactNode } from 'react'

import type { PlayerStat } from '@/lib/rank-scale'
import type { UserRow } from '@/lib/rows'

import { use, useState } from 'react'

import { rankPosition } from '@/lib/rank-scale'

import { HoveredContext, SetHoveredContext } from './hovered-member-context'

/**
 * Shares the player row under the pointer in a page's users table with its rank map.
 */
export function HoveredMemberProvider({ children }: { children: ReactNode }) {
  const [hovered, setHovered] = useState<UserRow | null>(null)

  return (
    <SetHoveredContext value={setHovered}>
      <HoveredContext value={hovered}>{children}</HoveredContext>
    </SetHoveredContext>
  )
}

/**
 * The hovered player's name, for the rank map legend.
 */
export function HoveredMemberName() {
  const hovered = use(HoveredContext)
  if (!hovered) {
    return null
  }

  return (
    <span className="text-foreground ml-2 inline-flex items-center gap-1.5">
      <span className="ring-card size-2.5 rounded-full bg-white ring-2" />
      {hovered.username}
    </span>
  )
}

/**
 * The hovered player's own spot on a rank map track.
 */
export function HoveredMemberDot({ stat, players }: { stat: PlayerStat, players: number }) {
  const hovered = use(HoveredContext)
  const value = hovered?.[stat]
  const rank = hovered?.[`${stat}Rank`] as number | null | undefined
  if (rank == null || value == null || value === 0) {
    return null
  }

  return (
    <div
      className="ring-card absolute top-1/2 z-10 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white ring-2"
      style={{ left: `${rankPosition(rank, players)}%` }}
      title={hovered?.username}
    />
  )
}
