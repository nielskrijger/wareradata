'use client'

import type { SortingState } from '@tanstack/react-table'

import { parseAsInteger, parseAsString, parseAsStringEnum, useQueryState, useQueryStates } from 'nuqs'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useStored } from '@/lib/local-storage'

const FILTER_DEBOUNCE_MS = 250

const urlOpts = { shallow: true, scroll: false, history: 'replace' as const }

/**
 * The last view tab picked on any table, so every table that has it opens there.
 */
const VIEW_KEY = 'wareradata:column-view'

/**
 * A table's default page size must be one of these.
 */
export const PAGE_SIZES = [25, 50, 100] as const

interface Sort {
  id: string
  desc: boolean
}

interface Args {
  initialSort: Sort
  defaultPageSize: number

  /**
   * The table's view tabs, the first being its default; empty for none.
   */
  views?: readonly string[]

  /**
   * Default sort per view tab, replacing `initialSort` while that tab is open.
   */
  viewSorts?: Partial<Record<string, Sort>>
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
  pageSize: number
  setPageSize: (size: number) => void

  /**
   * The open view tab: the URL's, else the last one picked on any table, else
   * the first. Switching tabs drops the sort and page, so the new tab opens on
   * its own default sort.
   */
  view: string
  setView: (view: string) => void

  /**
   * True when the fetched rows match `initialSort` with no filter or paging,
   * i.e. `initialData` is still the right page.
   */
  isAtInitialState: boolean
}

/**
 * Syncs the table's filter, sort and page with the URL, leaving defaults out
 * so the URL stays clean.
 *
 * The filter is debounced so history doesn't fill with every keystroke, and
 * updates are shallow so the server doesn't re-render on each change.
 */
export function useTableUrlState({ initialSort, defaultPageSize, views = [], viewSorts }: Args): State {
  const [q, setQ] = useQueryState('q', parseAsString.withDefault('').withOptions(urlOpts))
  const [viewParam, setViewParam] = useQueryState('view', parseAsString.withDefault('').withOptions(urlOpts))
  const [storedView, setStoredView] = useStored(VIEW_KEY)

  // Views this table lacks (from another table's URL or pick) fall back.
  const view = [viewParam, storedView].find(v => v && views.includes(v)) ?? views[0] ?? ''
  const defaultSort = viewSorts?.[view] ?? initialSort

  const [sortParam, setSortParam] = useQueryState(
    'sort',
    parseAsString.withDefault(defaultSort.id).withOptions(urlOpts),
  )

  const defaultDir: 'asc' | 'desc' = defaultSort.desc ? 'desc' : 'asc'
  const [dirParam, setDirParam] = useQueryState(
    'dir',
    parseAsStringEnum(['asc', 'desc']).withDefault(defaultDir).withOptions(urlOpts),
  )

  const [pageParam, setPageParam] = useQueryState(
    'page',
    parseAsInteger.withDefault(1).withOptions(urlOpts),
  )

  const [sizeParam, setSizeParam] = useQueryState(
    'size',
    parseAsInteger.withDefault(defaultPageSize).withOptions(urlOpts),
  )

  // Hand-edited URLs can carry any size.
  const pageSize = (PAGE_SIZES as readonly number[]).includes(sizeParam) ? sizeParam : defaultPageSize
  const setPageSize = useCallback(
    (size: number) => {
      setSizeParam(size === defaultPageSize ? null : size)
    },
    [defaultPageSize, setSizeParam],
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

  // The last `q` the user typed, to tell typing from an outside URL change
  // (back/forward, a link like /users?q=country:nl) that must overwrite the input.
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
      const first = next[0] ?? defaultSort
      const nextDir: 'asc' | 'desc' = first.desc ? 'desc' : 'asc'
      setSortParam(first.id === defaultSort.id ? null : first.id)
      setDirParam(nextDir === defaultDir ? null : nextDir)
    },
    [sorting, setSortParam, setDirParam, defaultSort, defaultDir],
  )

  // Any change to sort, filter or page size snaps back to page 1 — keeps URLs
  // sensible (a page index into a now-different set is rarely useful).
  const resetKey = `${sortParam}:${dirParam}|${q}|${pageSize}`
  const lastResetKeyRef = useRef(resetKey)
  if (lastResetKeyRef.current !== resetKey) {
    lastResetKeyRef.current = resetKey
    if (pageIndex !== 0) {
      setPageIndex(0)
    }
  }

  const isAtInitialState
    = pageIndex === 0
      && q === ''
      && sortParam === initialSort.id
      && dirParam === (initialSort.desc ? 'desc' : 'asc')
      && pageSize === defaultPageSize

  return {
    q,
    filterInput,
    setFilterInput,
    sorting,
    setSorting,
    pageIndex,
    setPageIndex,
    pageSize,
    setPageSize,
    view,
    setView: (next: string) => {
      const isDefault = next === views[0]
      setSortParam(null)
      setDirParam(null)
      setPageParam(null)
      setViewParam(isDefault ? null : next)
      setStoredView(isDefault ? null : next)
    },
    isAtInitialState,
  }
}

/**
 * Clears the table URL keys, for pages that swap one DataTable for another
 * behind tabs: every table reads the same keys, so `?page=2` from one would
 * otherwise carry into the next.
 */
export function useClearTableUrlState(): () => void {
  const [, setTableState] = useQueryStates(
    { q: parseAsString, sort: parseAsString, dir: parseAsString, page: parseAsString, view: parseAsString },
    urlOpts,
  )

  return useCallback(() => {
    setTableState({ q: null, sort: null, dir: null, page: null, view: null })
  }, [setTableState])
}
