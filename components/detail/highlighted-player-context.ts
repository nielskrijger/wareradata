'use client'

import type { MemberSpots } from '@/lib/rank-scale'
import type { UserRow } from '@/lib/rows'

import { createContext } from 'react'

/**
 * The player under the pointer, in a page's users table or on its rank map
 * ticks, shown on both. Without a provider, setting it does nothing.
 */
export type HighlightedPlayer = UserRow | MemberSpots

export const HighlightedPlayerContext = createContext<{
  row: HighlightedPlayer | null
  set: (row: HighlightedPlayer | null) => void
}>({
  row: null,
  set: () => {
  },
})

/**
 * The rank map's members, so pointing at a tick can find the player under it.
 */
export const RankMapMembersContext = createContext<MemberSpots[]>([])
