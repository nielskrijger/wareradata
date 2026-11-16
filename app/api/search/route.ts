import type { NextRequest } from 'next/server'
import type { SearchResponse } from '@/lib/search/types'

import { getSnapshot } from '@/lib/cache/memory'
import { searchSnapshot } from '@/lib/search'

/**
 * Longer input is never a name and only costs scan time.
 */
const MAX_QUERY_LENGTH = 64

/**
 * Backs the nav search box: `?q=` → countries, MUs and users grouped by kind.
 */
export async function GET(request: NextRequest) {
  const query = (request.nextUrl.searchParams.get('q') ?? '').slice(0, MAX_QUERY_LENGTH)
  const body: SearchResponse = { groups: searchSnapshot(await getSnapshot(), query) }

  return Response.json(body)
}
