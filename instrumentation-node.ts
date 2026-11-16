import { sweepStaleTempFiles } from '@/lib/cache/file-store'
import { initSnapshot } from '@/lib/cache/memory'
import { startScraper } from '@/lib/scraper'

/**
 * Node-only boot. The snapshot loads before the first request; the scraper
 * starts without blocking readiness. The sweep removes temp files a killed
 * instance left behind.
 */
export async function boot(): Promise<void> {
  await sweepStaleTempFiles()
  await initSnapshot()
  startScraper()
}
