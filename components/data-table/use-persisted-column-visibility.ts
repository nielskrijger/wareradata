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
 * Storage can throw (private mode, blocked site data); fall back to the defaults.
 */
function readRaw(key: string): string | null {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeRaw(key: string, overrides: ColumnVisibilityState) {
  try {
    if (Object.keys(overrides).length === 0) {
      window.localStorage.removeItem(key)
    } else {
      window.localStorage.setItem(key, JSON.stringify(overrides))
    }
  } catch {
    return
  }

  listeners.forEach(listener => listener())
}

/**
 * Stored choices: a `{ id: visible }` map, or an array of hidden ids as
 * written by earlier versions of the site.
 */
function parseOverrides(raw: string | null): ColumnVisibilityState {
  if (!raw) {
    return {}
  }

  try {
    const value: unknown = JSON.parse(raw)
    if (Array.isArray(value)) {
      return Object.fromEntries(value.filter((id): id is string => typeof id === 'string').map(id => [id, false]))
    }

    if (value && typeof value === 'object') {
      return Object.fromEntries(Object.entries(value).filter(([, visible]) => typeof visible === 'boolean'))
    }
  } catch {
    // Unreadable value: use the defaults.
  }

  return {}
}

/**
 * Column visibility for a DataTable, remembered per table in localStorage.
 *
 * `hiddenByDefault` lists the columns that start hidden; everything else
 * starts visible. Only choices that differ from those defaults are stored, so
 * columns added later get their default, and the setter takes the table's
 * current hideable ids to prune ids of removed or renamed columns.
 *
 * The server and first client render use the defaults; stored choices apply
 * right after hydration.
 */
export function usePersistedColumnVisibility(
  tableId: string,
  hiddenByDefault: readonly string[],
): [ColumnVisibilityState, (updater: Updater<ColumnVisibilityState>, knownIds: string[]) => void] {
  const key = KEY_PREFIX + tableId
  const raw = useSyncExternalStore(subscribe, () => readRaw(key), () => null)

  // Joined so a fresh array with the same ids each render keeps the memo.
  const defaultsKey = hiddenByDefault.join('\n')
  const defaults = useMemo<ColumnVisibilityState>(
    () => Object.fromEntries((defaultsKey ? defaultsKey.split('\n') : []).map(id => [id, false])),
    [defaultsKey],
  )

  const visibility = useMemo<ColumnVisibilityState>(
    () => ({ ...defaults, ...parseOverrides(raw) }),
    [defaults, raw],
  )

  const setVisibility = useCallback((updater: Updater<ColumnVisibilityState>, knownIds: string[]) => {
    const current: ColumnVisibilityState = { ...defaults, ...parseOverrides(readRaw(key)) }
    const next = typeof updater === 'function' ? updater(current) : updater
    const overrides: ColumnVisibilityState = {}
    for (const id of knownIds) {
      const visible = next[id] ?? true
      if (visible !== (defaults[id] ?? true)) {
        overrides[id] = visible
      }
    }

    writeRaw(key, overrides)
  }, [key, defaults])

  return [visibility, setVisibility]
}
