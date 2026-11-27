'use client'

import type { UserRow } from '@/lib/rows'

import { createContext } from 'react'

export type HighlightedPlayer = Pick<UserRow, 'id' | 'username'>

/**
 * The player shown on a page's rank map: the one under the pointer, in its
 * users table or on its ticks, else the one pinned by clicking a tick (kept
 * in the URL). Without a provider, setting either does nothing.
 */
export const HighlightedPlayerContext = createContext<{
  /**
   * The shown player's id.
   */
  id: string | null
  hovered: HighlightedPlayer | null
  pinned: string | null
  set: (row: HighlightedPlayer | null) => void
  pin: (id: string | null) => void
}>({
  id: null,
  hovered: null,
  pinned: null,
  set: () => {
  },
  pin: () => {
  },
})
