import { factoriesNdjsonPath } from '@/lib/cache/factory-store'
import { readRawSnapshot } from '@/lib/cache/file-store'
import { logger } from '@/lib/log'
import { scrapeFactories } from '@/lib/warera/scrape-factories'

const log = logger.child({ phase: 'factory-scrape' })

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
    log.error('no snapshot yet; run the main scrape first')
    process.exit(1)
  }

  const count = await scrapeFactories(raw.users, { limit })
  log.info({ withFactories: count, path: factoriesNdjsonPath() }, 'done')
}

main().catch((err) => {
  log.error({ err }, 'failed')
  process.exit(1)
})
