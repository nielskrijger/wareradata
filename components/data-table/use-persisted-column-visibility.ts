'use client'

import type { ColumnVisibilityState, Updater } from '@tanstack/react-table'

import { useCallback, useMemo, useSyncExternalStore } from 'react'

const KEY_PREFIX = 'wareradata:hidden-columns:'

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
 * Storage can throw (private mode, blocked site data); fall back to all-visible.
 */
function readRaw(key: string): string | null {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeRaw(key: string, hidden: string[]) {
  try {
    if (hidden.length === 0) {
      window.localStorage.removeItem(key)
    } else {
      window.localStorage.setItem(key, JSON.stringify(hidden))
    }
  } catch {
    return
  }

  listeners.forEach(listener => listener())
}

function parseHidden(raw: string | null): string[] {
  if (!raw) {
    return []
  }

  try {
    const value: unknown = JSON.parse(raw)

    return Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string') : []
  } catch {
    return []
  }
}

/**
 * Column visibility for a DataTable, remembered per table in localStorage.
 *
 * Only hidden column ids are stored, so columns added later start visible and
 * ids of removed or renamed columns match nothing. The setter takes the
 * table's current hideable ids to prune those stale ids on the next write.
 *
 * The server and first client render show every column; stored choices apply
 * right after hydration.
 */
export function usePersistedColumnVisibility(
  tableId: string,
): [ColumnVisibilityState, (updater: Updater<ColumnVisibilityState>, knownIds: string[]) => void] {
  const key = KEY_PREFIX + tableId
  const raw = useSyncExternalStore(subscribe, () => readRaw(key), () => null)

  const visibility = useMemo<ColumnVisibilityState>(
    () => Object.fromEntries(parseHidden(raw).map(id => [id, false])),
    [raw],
  )

  const setVisibility = useCallback((updater: Updater<ColumnVisibilityState>, knownIds: string[]) => {
    const current: ColumnVisibilityState = Object.fromEntries(parseHidden(readRaw(key)).map(id => [id, false]))
    const next = typeof updater === 'function' ? updater(current) : updater
    const known = new Set(knownIds)
    writeRaw(key, Object.keys(next).filter(id => next[id] === false && known.has(id)))
  }, [key])

  return [visibility, setVisibility]
}
