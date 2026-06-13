import { factorySnapshotPath } from '@/lib/cache/factory-store'
import { readRawSnapshot } from '@/lib/cache/file-store'
import { scrapeAllFactories } from '@/lib/warera/scrape-factories'

/**
 * Manual one-shot of the all-users factory scrape (`npm run scrape-factories`).
 * The server runs this continuously via the factory loop; this script is for a
 * local/ad-hoc pass. `--limit=N` scans only the first N users (cheap test run).
 */
async function main() {
  const limitArg = process.argv.find(a => a.startsWith('--limit='))
  const limit = limitArg ? Number(limitArg.split('=')[1]) : undefined

  const raw = await readRawSnapshot()
  if (!raw) {
    console.error('[factory-scrape] no snapshot yet; run the main scrape first')
    process.exit(1)
  }

  const count = await scrapeAllFactories(raw.users, { limit })
  console.info(`[factory-scrape] done: ${count} users with factories → ${factorySnapshotPath()}`)
}

main().catch((err) => {
  console.error('[factory-scrape] failed', err)
  process.exit(1)
})
