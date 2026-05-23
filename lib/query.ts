/**
 * Shared filter / sort / paginate helpers for the in-memory row caches.
 * Used by both /api/users and /api/countries.
 */

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
  const filter = (searchParams.get('filter') ?? '').trim().toLowerCase()
  return { page, pageSize, sort, dir, filter }
}

export interface PagedResult<T> {
  rows: T[]
  total: number
}

/**
 * Filter → sort → paginate. `getFilterHaystack` returns the lowercased text the
 * filter substring is matched against (concat of fields that should be searchable).
 * `sortValue` returns the comparable value for a given column id, or undefined if
 * the column isn't sortable / unknown.
 */
export function applyQuery<T>(
  rows: T[],
  query: QueryParams,
  getFilterHaystack: (row: T) => string,
  sortValue: (row: T, sort: string) => number | string | null,
): PagedResult<T> {
  let filtered = rows
  if (query.filter) {
    filtered = rows.filter(r => getFilterHaystack(r).includes(query.filter))
  }

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
  }
}
