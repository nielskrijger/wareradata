'use client'

import type { UserRow } from '@/lib/rows'

import { createContext } from 'react'

export type HighlightedPlayer = Pick<UserRow, 'id' | 'username'>

/**
 * The player shown on a page's rank map: the one under the pointer, in its
 * users table or on its ticks, else the one pinned by clicking a tick.
 * Without a provider, setting it does nothing.
 */
export const HighlightedPlayerContext = createContext<{
  row: HighlightedPlayer | null
  pinned: HighlightedPlayer | null
  set: (row: HighlightedPlayer | null) => void
  pin: (row: HighlightedPlayer | null) => void
}>({
  row: null,
  pinned: null,
  set: () => {
  },
  pin: () => {
  },
})
