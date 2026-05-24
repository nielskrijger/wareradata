'use client'

import type { SortingState } from '@tanstack/react-table'

import { parseAsInteger, parseAsString, parseAsStringEnum, useQueryState } from 'nuqs'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

const FILTER_DEBOUNCE_MS = 250

const urlOpts = { shallow: true, scroll: false, history: 'replace' as const }

interface Args {
  initialSort: { id: string, desc: boolean }
}

interface State {
  /**
   * Debounced filter value — drives the fetch.
   */
  q: string
  /**
   * Snappy input value — drives the controlled `<Input value=...>`.
   */
  filterInput: string
  setFilterInput: (value: string) => void
  sorting: SortingState
  setSorting: (updater: SortingState | ((prev: SortingState) => SortingState)) => void
  pageIndex: number
  setPageIndex: (updater: number | ((prev: number) => number)) => void
  /**
   * True when state matches the page's defaults (no params in URL).
   */
  isAtInitialState: boolean
}

/**
 * Two-way sync between the DataTable's filter/sort/page state and the URL
 * query string (`?q=...&sort=...&dir=...&page=...`). Values that match the
 * page's defaults are stripped from the URL so it stays clean until the user
 * changes something.
 *
 * `page` is 1-based in the URL but 0-based everywhere in React (matches
 * TanStack Table). Filter input is debounced before being written to the URL
 * so typing stays snappy and history doesn't fill with intermediate values.
 *
 * Updates use shallow routing so the server route doesn't re-execute on every
 * keystroke / sort click.
 */
export function useTableUrlState({ initialSort }: Args): State {
  const [q, setQ] = useQueryState('q', parseAsString.withDefault('').withOptions(urlOpts))
  const [sortParam, setSortParam] = useQueryState(
    'sort',
    parseAsString.withDefault(initialSort.id).withOptions(urlOpts),
  )
  const initialDir: 'asc' | 'desc' = initialSort.desc ? 'desc' : 'asc'
  const [dirParam, setDirParam] = useQueryState(
    'dir',
    parseAsStringEnum(['asc', 'desc']).withDefault(initialDir).withOptions(urlOpts),
  )
  const [pageParam, setPageParam] = useQueryState(
    'page',
    parseAsInteger.withDefault(1).withOptions(urlOpts),
  )

  const pageIndex = Math.max(0, pageParam - 1)
  const setPageIndex = useCallback(
    (updater: number | ((prev: number) => number)) => {
      const next = typeof updater === 'function' ? updater(pageIndex) : updater
      setPageParam(next === 0 ? null : next + 1)
    },
    [pageIndex, setPageParam],
  )

  const [filterInput, setFilterInput] = useState(q)

  // Track the last `q` value the user typed (after debounce flush) so we can
  // distinguish typing from external URL changes (back/forward, in-app links
  // like /users?q=country:nl). External changes overwrite the input;
  // typing flows the other way, debounced into the URL.
  const lastTypedQRef = useRef(q)
  if (q !== lastTypedQRef.current && q !== filterInput) {
    lastTypedQRef.current = q
    setFilterInput(q)
  }

  useEffect(() => {
    if (filterInput === q) {
      return
    }
    const handle = setTimeout(() => {
      lastTypedQRef.current = filterInput
      setQ(filterInput || null)
    }, FILTER_DEBOUNCE_MS)
    return () => clearTimeout(handle)
  }, [filterInput, q, setQ])

  const sorting: SortingState = useMemo(
    () => [{ id: sortParam, desc: dirParam === 'desc' }],
    [sortParam, dirParam],
  )
  const setSorting = useCallback(
    (updater: SortingState | ((prev: SortingState) => SortingState)) => {
      const next = typeof updater === 'function' ? updater(sorting) : updater
      const first = next[0] ?? initialSort
      const nextDir: 'asc' | 'desc' = first.desc ? 'desc' : 'asc'
      setSortParam(first.id === initialSort.id ? null : first.id)
      setDirParam(nextDir === initialDir ? null : nextDir)
    },
    [sorting, setSortParam, setDirParam, initialSort, initialDir],
  )

  // Any change to sort or filter snaps back to page 1 — keeps URLs sensible
  // (a page index into a now-different filtered set is rarely useful).
  const resetKey = `${sortParam}:${dirParam}|${q}`
  const lastResetKeyRef = useRef(resetKey)
  if (lastResetKeyRef.current !== resetKey) {
    lastResetKeyRef.current = resetKey
    if (pageIndex !== 0) {
      setPageIndex(0)
    }
  }

  const isAtInitialState
    = pageIndex === 0 && q === '' && sortParam === initialSort.id && dirParam === initialDir

  return {
    q,
    filterInput,
    setFilterInput,
    sorting,
    setSorting,
    pageIndex,
    setPageIndex,
    isAtInitialState,
  }
}
