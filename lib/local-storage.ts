'use client'

import { useCallback, useSyncExternalStore } from 'react'

/**
 * The `storage` event only fires in other tabs, so writes here notify directly.
 */
const listeners = new Set<() => void>()

function subscribe(listener: () => void) {
  listeners.add(listener)
  window.addEventListener('storage', listener)

  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', listener)
  }
}

/**
 * Storage can throw (private mode, blocked site data); callers then get their defaults.
 */
export function readStored(key: string): string | null {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

/**
 * Stores `value` under `key`, or removes the key for null.
 */
export function writeStored(key: string, value: string | null) {
  try {
    if (value == null) {
      window.localStorage.removeItem(key)
    } else {
      window.localStorage.setItem(key, value)
    }
  } catch {
    return
  }

  listeners.forEach(listener => listener())
}

/**
 * A localStorage value that re-renders on change, in this tab and others.
 *
 * The server and first client render see null; the stored value applies right
 * after hydration.
 */
export function useStored(key: string): [string | null, (value: string | null) => void] {
  const value = useSyncExternalStore(subscribe, () => readStored(key), () => null)
  const set = useCallback((next: string | null) => writeStored(key, next), [key])

  return [value, set]
}
