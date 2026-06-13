'use client'

import { useState } from 'react'

export type HoverStatus = 'idle' | 'loading' | 'ready' | 'error'

// Memoizes in-flight and resolved fetches across the page, keyed by the full
// URL, so two cells for the same entity share one network request and
// re-hovers are instant. Shared by every hover card (users, countries, …); the
// URL already namespaces by entity, so there's no cross-type collision.
const cache = new Map<string, Promise<unknown>>()

function fetchEntity<T>(url: string): Promise<T> {
  let p = cache.get(url) as Promise<T> | undefined
  if (p) {
    return p
  }

  p = fetch(url).then(async (res) => {
    if (!res.ok) {
      // Drop the failed entry so a later hover retries instead of replaying the
      // error indefinitely.
      cache.delete(url)
      throw new Error(`HTTP ${res.status}`)
    }
    return res.json() as Promise<T>
  })
  cache.set(url, p as Promise<unknown>)
  return p
}

interface EntityHover<T> {
  status: HoverStatus
  data: T | null
  // Pass to the tooltip's `onOpenChange`; fetches lazily on first open.
  onOpenChange: (open: boolean) => void
}

/**
 * The shared fetch-on-first-hover state machine behind the entity hover cards.
 * Pass the endpoint URL (or null when there's no entity to look up); on the
 * first tooltip open it fetches, caches, and exposes `{ status, data }` for the
 * card to render. Caching lives at module scope, so it persists for the session
 * and is shared across cards.
 */
export function useEntityHover<T>(url: string | null): EntityHover<T> {
  const [status, setStatus] = useState<HoverStatus>('idle')
  const [data, setData] = useState<T | null>(null)

  function onOpenChange(open: boolean) {
    if (!open || status !== 'idle' || !url) {
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
