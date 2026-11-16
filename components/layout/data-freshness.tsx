import { connection } from 'next/server'

import { RelativeTime } from '@/components/relative-time'
import { getSnapshot } from '@/lib/cache/memory'
import { isOlderThan } from '@/lib/format'

/**
 * A main scrape cycle takes about an hour; data older than this means the
 * scraper has missed at least a couple of cycles.
 */
const STALE_AFTER_MS = 3 * 60 * 60 * 1000

/**
 * "Data updated 14m ago", amber once the data is stale. Reads the snapshot per
 * request, so it renders inside a Suspense boundary.
 */
export async function DataFreshness() {
  await connection()
  const { scrapedAt } = await getSnapshot()
  if (!scrapedAt) {
    return <span>Waiting for the first data update</span>
  }

  const stale = isOlderThan(scrapedAt, STALE_AFTER_MS)

  return (
    <span className={stale ? 'text-amber-700 dark:text-amber-300' : undefined}>
      Data updated
      {' '}
      <RelativeTime iso={scrapedAt} />
      {stale && ', the 🐹 may be napping'}
    </span>
  )
}
