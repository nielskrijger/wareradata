'use client'

import { useEffect, useReducer } from 'react'

import { formatRelativeTime } from '@/lib/format'

// How often the label re-reads the clock so "1m" advances to "2m" on its own.
const TICK_MS = 30_000

interface Props {
  // ISO timestamp to show as a short relative time ("3h ago"); null renders the
  // empty placeholder.
  iso: string | null
  className?: string
}

/**
 * Renders an ISO timestamp as a self-advancing relative time. Derived during
 * render so a changed `iso` shows immediately, with an interval that re-reads
 * the clock so the label ticks up without a navigation. The value depends on
 * the current time, so SSR and the first client render can disagree across a
 * minute boundary; suppressHydrationWarning is the canonical fix for these
 * unavoidable server/client time differences.
 */
export function RelativeTime({ iso, className }: Props) {
  const [, tick] = useReducer((n: number) => n + 1, 0)
  useEffect(() => {
    const id = setInterval(tick, TICK_MS)
    return () => clearInterval(id)
  }, [])

  return (
    <span className={className} suppressHydrationWarning>
      {formatRelativeTime(iso)}
    </span>
  )
}
