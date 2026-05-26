import { initSnapshot } from '@/lib/cache/memory'
import { startScraper } from '@/lib/scraper'

// Loaded only in the Node.js runtime (see instrumentation.ts). Awaiting
// initSnapshot means the first request already sees the persisted (or empty)
// snapshot. startScraper is fire-and-forget: the loop must not block the server
// from becoming ready.
export async function boot(): Promise<void> {
  await initSnapshot()
  startScraper()
}
