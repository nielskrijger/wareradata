import type { RowData } from '@tanstack/react-table'

import type { PagedResult, QueryParams } from '@/lib/query'

/**
 * Fetches one page from a DataTable `/api/*` route.
 *
 * `baseFilter` travels as its own param so the server applies it as a scope
 * the user's filter can narrow but never widen.
 */
export async function fetchPaginated<T extends RowData>(
  endpoint: string,
  { page, pageSize, sort, dir, filter, baseFilter }: QueryParams,
): Promise<PagedResult<T>> {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
    dir,
  })

  if (sort) {
    params.set('sort', sort)
  }

  if (filter) {
    params.set('filter', filter)
  }

  if (baseFilter) {
    params.set('baseFilter', baseFilter)
  }

  const res = await fetch(`${endpoint}?${params.toString()}`)
  if (!res.ok) {
    throw new Error(`Fetch failed: ${endpoint} returned ${res.status}`)
  }

  return res.json() as Promise<PagedResult<T>>
}
