'use client'

import { createContext } from 'react'

/**
 * The players a page's rank map highlights, by id: the one hovered, in its
 * users table or on its ticks, and the one pinned by clicking a tick (kept in
 * the URL). Without a provider, setting either does nothing.
 */
export const HighlightedPlayerContext = createContext<{
  hovered: string | null
  pinned: string | null
  hover: (id: string | null) => void
  pin: (id: string | null) => void
}>({
  hovered: null,
  pinned: null,
  hover: () => {
  },
  pin: () => {
  },
})
