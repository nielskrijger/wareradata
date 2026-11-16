import type { RowData } from '@tanstack/react-table'

import type { PageRequest, PageResult } from './data-table'

/**
 * Fetches one page from a DataTable `/api/*` route.
 *
 * `baseFilter` travels as its own param so the server applies it as a scope
 * the user's filter can narrow but never widen.
 */
export async function fetchPaginated<T extends RowData>(
  endpoint: string,
  req: PageRequest,
  baseFilter?: string,
): Promise<PageResult<T>> {
  const params = new URLSearchParams({
    page: String(req.page),
    pageSize: String(req.pageSize),
    dir: req.dir,
  })

  if (req.sort) {
    params.set('sort', req.sort)
  }

  if (req.filter) {
    params.set('filter', req.filter)
  }

  if (baseFilter) {
    params.set('baseFilter', baseFilter)
  }

  const res = await fetch(`${endpoint}?${params.toString()}`)
  if (!res.ok) {
    throw new Error(`Fetch failed: ${endpoint} returned ${res.status}`)
  }

  return res.json() as Promise<PageResult<T>>
}
