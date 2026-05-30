import type { PageRequest, PageResult } from './data-table'

import { combineFilter } from './combine-filter'

/**
 * Client-side fetcher for any paginated `/api/*` endpoint that follows the
 * DataTable wire contract (`page` / `pageSize` / `sort` / `dir` / `filter`
 * query string, `{ rows, total, ranges? }` response).
 *
 * The optional `baseFilter` is AND-merged with the user's input via
 * {@link combineFilter} — used by scoped tables (the MU detail page's
 * member list, the party detail page's member list, etc.) to lock in a
 * parent context without leaking it into the visible filter input.
 */
export async function fetchPaginated<T>(
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
  const filter = combineFilter(baseFilter, req.filter)
  if (filter) {
    params.set('filter', filter)
  }

  const res = await fetch(`${endpoint}?${params.toString()}`)
  if (!res.ok) {
    throw new Error(`Fetch failed: ${endpoint} returned ${res.status}`)
  }
  return res.json() as Promise<PageResult<T>>
}
