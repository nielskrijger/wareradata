'use client'

import type { UserRow } from '@/lib/rows'

import { createContext } from 'react'

/**
 * The player row under the pointer in a page's users table, shared with its
 * rank map. Without a provider, setting it does nothing.
 */
export const HighlightedPlayerContext = createContext<{ row: UserRow | null, set: (row: UserRow | null) => void }>({
  row: null,
  set: () => {
  },
})
