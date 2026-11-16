import { connection } from 'next/server'

import { getSnapshot } from '@/lib/cache/memory'

import { FreshnessLabel } from './freshness-label'

/**
 * The age of the data on screen, read from the snapshot's scrape time. Reads
 * the snapshot per request, so it renders inside a Suspense boundary.
 */
export async function DataFreshness() {
  await connection()
  const { scrapedAt } = await getSnapshot()
  return <FreshnessLabel iso={scrapedAt} />
}
