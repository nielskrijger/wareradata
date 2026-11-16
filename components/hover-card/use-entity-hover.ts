'use client'

import { useState } from 'react'

export type HoverStatus = 'idle' | 'loading' | 'ready' | 'error'

/**
 * Fetches shared across every hover card for the session, keyed by URL, so two
 * cells for one entity make one request and re-hovers are instant.
 */
const cache = new Map<string, Promise<unknown>>()

function fetchEntity<T>(url: string): Promise<T> {
  let p = cache.get(url) as Promise<T> | undefined
  if (p) {
    return p
  }

  p = fetch(url).then(async (res) => {
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`)
    }

    return res.json() as Promise<T>
  })

  // Forget a failure so the next hover retries.
  p.catch(() => cache.delete(url))

  cache.set(url, p as Promise<unknown>)

  return p
}

interface EntityHover<T> {
  status: HoverStatus
  data: T | null

  /**
   * Pass to the tooltip's `onOpenChange`; fetches lazily on first open.
   */
  onOpenChange: (open: boolean) => void
}

/**
 * Fetches an entity's details on the first open of its hover card.
 */
export function useEntityHover<T>(url: string | null): EntityHover<T> {
  const [status, setStatus] = useState<HoverStatus>('idle')
  const [data, setData] = useState<T | null>(null)

  function onOpenChange(open: boolean) {
    if (!open || status === 'loading' || status === 'ready' || !url) {
      return
    }

    setStatus('loading')
    fetchEntity<T>(url)
      .then((d) => {
        setData(d)
        setStatus('ready')
      })
      .catch(() => {
        setStatus('error')
      })
  }

  return { status, data, onOpenChange }
}
