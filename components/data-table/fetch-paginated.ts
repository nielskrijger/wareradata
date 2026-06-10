import type { PageRequest, PageResult } from './data-table'

/**
 * Client-side fetcher for any paginated `/api/*` endpoint that follows the
 * DataTable wire contract (`page` / `pageSize` / `sort` / `dir` / `filter`
 * query string, `{ rows, total, ranges? }` response).
 *
 * The optional `baseFilter` (e.g. `muId:<id>` on a detail page's member list) is
 * sent as its own param, separate from the user's `filter`, so the server can
 * apply it as a locked-in scope the user's input can narrow but never widen
 * past, and a malformed filter can't break out of it.
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
