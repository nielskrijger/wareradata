'use client'

import { useEffect, useReducer } from 'react'

import { formatCountdown, formatRelativeTime } from '@/lib/format'

/**
 * How often the label re-reads the clock so "1m" advances to "2m" on its own.
 */
const TICK_MS = 30_000

interface Props {
  /**
   * ISO timestamp to show as a short relative time ("3h ago"); null renders the
   * empty placeholder.
   */
  iso: string | null
  className?: string
}

/**
 * Re-reads the clock on an interval so the label advances. Server and client
 * can disagree across a minute boundary, so callers suppress the hydration
 * warning.
 */
function useClockTick() {
  const [, tick] = useReducer((n: number) => n + 1, 0)
  useEffect(() => {
    const id = setInterval(tick, TICK_MS)

    return () => clearInterval(id)
  }, [])
}

/**
 * Renders an ISO timestamp as a self-advancing relative time ("3h ago"), so the
 * label ticks up without a navigation. Derived during render, so a changed `iso`
 * shows immediately.
 */
export function RelativeTime({ iso, className }: Props) {
  useClockTick()

  return (
    <span className={className} suppressHydrationWarning>
      {formatRelativeTime(iso)}
    </span>
  )
}

/**
 * Renders a future ISO timestamp as a self-advancing countdown ("3h12m"), for a
 * "time remaining" label that ticks down on its own.
 */
export function Countdown({ iso, className }: Props) {
  useClockTick()

  return (
    <span className={className} suppressHydrationWarning>
      {formatCountdown(iso)}
    </span>
  )
}
