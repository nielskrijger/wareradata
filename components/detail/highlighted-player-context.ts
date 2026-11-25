'use client'

import type { UserRow } from '@/lib/rows'

import { createContext } from 'react'

export type HighlightedPlayer = Pick<UserRow, 'id' | 'username'>

/**
 * The player under the pointer, in a page's users table or on its rank map
 * ticks, shown on both. Without a provider, setting it does nothing.
 */
export const HighlightedPlayerContext = createContext<{
  row: HighlightedPlayer | null
  set: (row: HighlightedPlayer | null) => void
}>({
  row: null,
  set: () => {
  },
})
