import type { NextRequest } from 'next/server'

import { getSnapshot } from '@/lib/cache/memory'
import { search } from '@/lib/search'

/**
 * Backs the nav search box. Long input is never a name, so it's cut short.
 */
export async function GET(request: NextRequest) {
  const query = (request.nextUrl.searchParams.get('q') ?? '').slice(0, 64)

  return Response.json(search(await getSnapshot(), query))
}
