import { sweepStaleTempFiles } from '@/lib/cache/file-store'
import { initSnapshot } from '@/lib/cache/memory'
import { startScraper } from '@/lib/scraper'

// Loaded only in the Node.js runtime (see instrumentation.ts). Awaiting
// initSnapshot means the first request already sees the persisted (or empty)
// snapshot. startScraper is fire-and-forget: the loop must not block the server
// from becoming ready. The temp-file sweep clears orphans from a previous
// instance that was killed mid-write (they are never read, only take disk).
export async function boot(): Promise<void> {
  await sweepStaleTempFiles()
  await initSnapshot()
  startScraper()
}
