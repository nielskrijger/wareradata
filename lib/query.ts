/**
 * Shared filter / sort / paginate helpers for the in-memory row caches,
 * used by every `/api/<entity>` table route.
 */

import { filter as liqeFilter, parse as liqeParse } from 'liqe'

export interface QueryParams {
  page: number
  pageSize: number
  sort: string | null
  dir: 'asc' | 'desc'
  filter: string

  /**
   * A locked-in scope (e.g. `muId:<id>` on a detail page), kept separate from
   * the user's `filter` so a malformed user filter can't widen past it. Empty
   * on the plain list pages.
   */
  baseFilter?: string
}

const DEFAULT_PAGE_SIZE = 25
const MAX_PAGE_SIZE = 200

function parseQuery(searchParams: URLSearchParams): QueryParams {
  const page = Math.max(0, Number(searchParams.get('page') ?? 0) | 0)
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, Number(searchParams.get('pageSize') ?? DEFAULT_PAGE_SIZE) | 0),
  )

  const sort = searchParams.get('sort')
  const dir = searchParams.get('dir') === 'desc' ? 'desc' : 'asc'

  // Not lowercased: liqe matches values case-insensitively.
  const filter = (searchParams.get('filter') ?? '').trim()
  const baseFilter = (searchParams.get('baseFilter') ?? '').trim()

  return { page, pageSize, sort, dir, filter, baseFilter }
}

/**
 * [min, max, median] over the full filtered set. The median lets the client
 * anchor a ramp at a typical value (skewed columns like avgLevel) instead of
 * the minimum, so low/typical rows stay calm.
 */
export type Range = [number, number, number]

export interface PagedResult<T> {
  rows: T[]
  total: number

  /**
   * Per-numeric-column range over the full filtered set (not just the page),
   * for client-side heat coloring. The client uses whichever keys it needs.
   */
  ranges?: Record<string, Range>
}

/**
 * [min, max, median] for every numeric field, so the client can tint any
 * column without the server listing them.
 */
export function computeRanges<T extends object>(rows: T[]): Record<string, Range> {
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
 * Ranges over the filtered rows, then sort (nulls last either way) and page.
 */
function sortAndPaginate<T extends object>(
  filtered: T[],
  query: QueryParams,
  sortValue: (row: T, sort: string) => number | string | null,
): PagedResult<T> {
  const ranges = computeRanges(filtered)

  let sorted = filtered
  if (query.sort) {
    const sortField = query.sort
    const dirMul = query.dir === 'desc' ? -1 : 1
    sorted = [...filtered].sort((a, b) => {
      const av = sortValue(a, sortField)
      const bv = sortValue(b, sortField)
      // Nulls always sort last regardless of direction.
      if (av == null || bv == null) {
        return (av == null ? 1 : 0) - (bv == null ? 1 : 0)
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
    rows: sorted.slice(start, start + query.pageSize),
    total: sorted.length,
    ranges,
  }
}

/**
 * The server-rendered first page; the client takes over paging, sorting and
 * filtering once hydrated.
 */
export function firstPage<T extends object>(
  rows: T[],
  sortField: Extract<keyof T, string>,
): PagedResult<T> {
  return sortAndPaginate(
    rows,
    { page: 0, pageSize: DEFAULT_PAGE_SIZE, sort: sortField, dir: 'desc', filter: '' },
    makeSortValue(),
  )
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
 * Accepts `field=value` for liqe's `field:value`. Only an `=` right after a bare
 * field token is rewritten, so `>=`, `<=` and quoted values are untouched.
 */
function normalizeEquals(filter: string): string {
  return filter.replace(/(^|[\s(])([\w.]+)=/g, '$1$2:')
}

/**
 * An unparseable expression passes the rows through, so a typo narrows
 * nothing instead of throwing.
 */
function runLiqeFilter<T extends object>(rows: T[], expr: string, aliases: FieldAliases): T[] {
  if (!expr) {
    return rows
  }

  try {
    const ast = liqeParse(expr)
    rewriteAliases(ast, aliases)

    return liqeFilter(ast, rows as unknown as Record<string, unknown>[]) as unknown as T[]
  } catch {
    return rows
  }
}

/**
 * Filters with liqe (`country:nl -mu:"Bla" rank:[1 TO 100]`, or plain text),
 * then sorts and pages. `aliases` maps friendly field names to row keys.
 */
function applyStructuredQuery<T extends object>(
  rows: T[],
  query: QueryParams,
  sortValue: (row: T, sort: string) => number | string | null,
  aliases: FieldAliases = {},
): PagedResult<T> {
  // Base scope first, then the user's filter over the scoped rows: the same as
  // `base AND (user)`, but a broken or OR-ed user filter can never reach rows
  // outside the scope.
  const scoped = runLiqeFilter(rows, query.baseFilter ?? '', aliases)
  const filtered = runLiqeFilter(scoped, normalizeEquals(query.filter), aliases)

  return sortAndPaginate(filtered, query, sortValue)
}

type SortValue = number | string | null

/**
 * Sorts any column by its own row value; `custom` covers columns whose value
 * doesn't order naturally (tiers, buffs). Strings compare lowercased so
 * names sort case-insensitively.
 */
export function makeSortValue<T>(
  custom: Record<string, (row: T) => SortValue> = {},
): (row: T, sort: string) => SortValue {
  return (row, sort) => {
    if (Object.hasOwn(custom, sort)) {
      return custom[sort](row)
    }

    const value = (row as Record<string, unknown>)[sort]
    if (typeof value === 'number') {
      return value
    }

    if (typeof value === 'boolean') {
      return value ? 1 : 0
    }

    return typeof value === 'string' ? value.toLowerCase() : null
  }
}

/**
 * The GET handler shared by every `/api/<entity>` table route.
 */
export function createTableRoute<T extends object>(
  loadRows: () => Promise<T[]>,
  sortValue: (row: T, sort: string) => number | string | null,
  aliases?: FieldAliases,
): (req: Request) => Promise<Response> {
  return async (req) => {
    const query = parseQuery(new URL(req.url).searchParams)
    const rows = await loadRows()

    return Response.json(applyStructuredQuery(rows, query, sortValue, aliases))
  }
}
