'use client'

import type { ReactNode } from 'react'

import type { PlayerStat } from '@/lib/rank-scale'
import type { UserRow } from '@/lib/rows'

import { use, useState } from 'react'

import { playerPosition } from '@/lib/rank-scale'

import { HighlightedPlayerContext } from './highlighted-player-context'

const DOT = 'ring-card rounded-full bg-white ring-2'

export function HighlightedPlayerProvider({ children }: { children: ReactNode }) {
  const [row, setRow] = useState<UserRow | null>(null)

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
  const at = row && playerPosition(row, stat, players)

  return at != null && (
    <div
      className={`absolute top-1/2 z-10 size-3 -translate-x-1/2 -translate-y-1/2 ${DOT}`}
      style={{ left: `${at}%` }}
    />
  )
}
