'use client'

import { useEffect, useReducer } from 'react'

import { formatRelativeTime, isOlderThan } from '@/lib/format'
import { cn } from '@/lib/utils'

/**
 * A main scrape cycle takes about an hour; data older than this means the
 * scraper has missed at least a couple of cycles.
 */
const STALE_AFTER_MS = 3 * 60 * 60 * 1000

const TICK_MS = 30_000

interface Props {
  iso: string | null
}

/**
 * "Data updated 14 minutes ago", turning amber once the data is stale. Re-reads
 * the clock on an interval so both the label and the stale state advance
 * without a navigation.
 */
export function FreshnessLabel({ iso }: Props) {
  const [, tick] = useReducer((n: number) => n + 1, 0)
  useEffect(() => {
    const id = setInterval(tick, TICK_MS)
    return () => clearInterval(id)
  }, [])

  if (!iso) {
    return <span>Waiting for the first data update</span>
  }

  const stale = isOlderThan(iso, STALE_AFTER_MS)
  const exact = new Date(iso).toUTCString()

  return (
    <span
      className={cn(stale && 'text-amber-700 dark:text-amber-300')}
      title={exact}
      suppressHydrationWarning
    >
      Data updated
      {' '}
      <time dateTime={iso} suppressHydrationWarning>{formatRelativeTime(iso)}</time>
      {stale && ', the 🐹 may be napping'}
    </span>
  )
}
