/**
 * Shared filter / sort / paginate helpers for the in-memory row caches.
 * Used by both /api/users and /api/countries.
 */

import { filter as liqeFilter, parse as liqeParse } from 'liqe'

export interface QueryParams {
  page: number
  pageSize: number
  sort: string | null
  dir: 'asc' | 'desc'
  filter: string
}

export const DEFAULT_PAGE_SIZE = 25
const MAX_PAGE_SIZE = 200

export function parseQuery(searchParams: URLSearchParams): QueryParams {
  const page = Math.max(0, Number(searchParams.get('page') ?? 0) | 0)
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, Number(searchParams.get('pageSize') ?? DEFAULT_PAGE_SIZE) | 0),
  )
  const sort = searchParams.get('sort')
  const dir = searchParams.get('dir') === 'desc' ? 'desc' : 'asc'

  // Note: not lowercasing — applyQuery's substring path lowercases its own
  // haystack, and applyStructuredQuery hands the raw text to liqe (which
  // is case-insensitive on values by default).
  const filter = (searchParams.get('filter') ?? '').trim()

  return { page, pageSize, sort, dir, filter }
}

// [min, max, median] over the full filtered set. The median lets the client
// anchor a ramp at a typical value (skewed columns like avgLevel) instead of
// the minimum, so low/typical rows stay calm.
export type Range = [number, number, number]

export interface PagedResult<T> {
  rows: T[]
  total: number
  // Per-numeric-column range over the full filtered set (not just the page),
  // for client-side heat coloring. The client uses whichever keys it needs.
  ranges?: Record<string, Range>
}

/**
 * Computes [min, max, median] for every numeric field across `rows`, ignoring
 * null/undefined/non-finite values. The set of fields is discovered from the
 * rows themselves (any key that is numeric on at least one row), so callers
 * don't have to enumerate columns — the client picks whichever it heat-tints.
 */
function computeRanges<T extends object>(rows: T[]): Record<string, Range> {
  if (!rows.length) {
    return {}
  }

  const buckets = new Map<string, number[]>()
  for (const row of rows) {
    for (const [key, v] of Object.entries(row as Record<string, unknown>)) {
      if (typeof v === 'number' && Number.isFinite(v)) {
        let values = buckets.get(key)
        if (!values) {
          values = []
          buckets.set(key, values)
        }
        values.push(v)
      }
    }
  }

  const out: Record<string, Range> = {}
  for (const [key, values] of buckets) {
    values.sort((a, b) => a - b)
    out[key] = [values[0], values[values.length - 1], values[Math.floor(values.length / 2)]]
  }
  return out
}

/**
 * Filter → sort → paginate. `getFilterHaystack` returns the lowercased text the
 * filter substring is matched against (concat of fields that should be searchable).
 * `sortValue` returns the comparable value for a given column id, or undefined if
 * the column isn't sortable / unknown.
 */
export function applyQuery<T extends object>(
  rows: T[],
  query: QueryParams,
  getFilterHaystack: (row: T) => string,
  sortValue: (row: T, sort: string) => number | string | null,
): PagedResult<T> {
  let filtered = rows
  if (query.filter) {
    const needle = query.filter.toLowerCase()
    filtered = rows.filter(r => getFilterHaystack(r).includes(needle))
  }

  const ranges = computeRanges(filtered)

  if (query.sort) {
    const sortField = query.sort
    const dirMul = query.dir === 'desc' ? -1 : 1
    filtered = [...filtered].sort((a, b) => {
      const av = sortValue(a, sortField)
      const bv = sortValue(b, sortField)
      // Nulls always sort last regardless of direction.
      if (av === null || av === undefined) {
        return 1
      }
      if (bv === null || bv === undefined) {
        return -1
      }
      if (av < bv) {
        return -1 * dirMul
      }
      if (av > bv) {
        return 1 * dirMul
      }
      return 0
    })
  }

  const start = query.page * query.pageSize
  return {
    rows: filtered.slice(start, start + query.pageSize),
    total: filtered.length,
    ranges,
  }
}

/**
 * Maps friendly field names (typed by users) to the underlying row keys.
 * `country` → `countryCode`, `mu` → `muName`, etc.
 */
export type FieldAliases = Readonly<Record<string, string>>

/**
 * Walks a liqe AST and rewrites any Field node whose `name` matches the
 * alias map. Mutates in place — the AST is throwaway per request.
 */
function rewriteAliases(node: unknown, aliases: FieldAliases): void {
  if (!node || typeof node !== 'object') {
    return
  }
  const n = node as Record<string, unknown>
  const field = n.field as { name?: string, path?: string[] } | undefined
  if (field && typeof field.name === 'string') {
    const real = aliases[field.name]
    if (real) {
      field.name = real
      field.path = [real]
    }
  }

  // Recurse into structural children that may carry more Tag nodes.
  rewriteAliases(n.operand, aliases) // UnaryOperator
  rewriteAliases(n.left, aliases) // LogicalExpression
  rewriteAliases(n.right, aliases) // LogicalExpression
  rewriteAliases(n.expression, aliases) // ParenthesizedExpression
}

/**
 * Variant of {@link applyQuery} that runs the filter through liqe, supporting
 * structured queries like `country:net -mu:"Bla bla" levelRank:[1 TO 100]` as
 * well as plain free-text. Free-text falls back to liqe's whole-row substring
 * search so casual users still get sensible behaviour.
 *
 * Pass `aliases` to map friendly field names to underlying row keys (e.g.
 * `{ country: 'countryCode' }` lets users type `country:nl` instead of
 * `countryCode:nl`). Underlying names still work either way.
 *
 * Returns the unfiltered rows on parse failure (e.g. user typing `mu:` mid-
 * word) — better than throwing.
 */
export function applyStructuredQuery<T extends object>(
  rows: T[],
  query: QueryParams,
  sortValue: (row: T, sort: string) => number | string | null,
  aliases: FieldAliases = {},
): PagedResult<T> {
  let filtered = rows
  if (query.filter) {
    try {
      const ast = liqeParse(query.filter)
      rewriteAliases(ast, aliases)
      filtered = liqeFilter(ast, rows as unknown as Record<string, unknown>[]) as unknown as T[]
    } catch {
      filtered = rows
    }
  }

  const ranges = computeRanges(filtered)

  if (query.sort) {
    const sortField = query.sort
    const dirMul = query.dir === 'desc' ? -1 : 1
    filtered = [...filtered].sort((a, b) => {
      const av = sortValue(a, sortField)
      const bv = sortValue(b, sortField)
      if (av === null || av === undefined) {
        return 1
      }
      if (bv === null || bv === undefined) {
        return -1
      }
      if (av < bv) {
        return -1 * dirMul
      }
      if (av > bv) {
        return 1 * dirMul
      }
      return 0
    })
  }

  const start = query.page * query.pageSize
  return {
    rows: filtered.slice(start, start + query.pageSize),
    total: filtered.length,
    ranges,
  }
}
