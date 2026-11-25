'use client'

import type { UserRow } from '@/lib/rows'

import { createContext, use } from 'react'

export const HoveredContext = createContext<UserRow | null>(null)

export const SetHoveredContext = createContext<(row: UserRow | null) => void>(() => {
  // No provider (no rank map on the page): nothing to show the hover on.
})

/**
 * Report the hovered row to the page's rank map.
 */
export function useSetHoveredMember() {
  return use(SetHoveredContext)
}
