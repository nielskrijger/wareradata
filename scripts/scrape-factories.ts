import { factoriesNdjsonPath } from '@/lib/cache/factory-store'
import { loadFactoryScrapeInputs } from '@/lib/cache/users-store'
import { buildTheoreticalModel } from '@/lib/factories/theoretical'
import { logger } from '@/lib/log'
import { getGameConfig } from '@/lib/warera/api'
import { scrapeFactories } from '@/lib/warera/scrape-factories'

const log = logger.child({ component: 'factory-scrape' })

/**
 * Manual one-shot of the all-users factory scrape (`npm run scrape-factories`).
 * The server runs this continuously via the factory loop; this script is for a
 * local/ad-hoc pass. `--limit=N` scans only the first N users (cheap test run).
 */
async function main() {
  const limitArg = process.argv.find(a => a.startsWith('--limit='))
  const limit = limitArg ? Number(limitArg.split('=')[1]) : undefined

  const { ownerIds, skillByUser } = await loadFactoryScrapeInputs()
  if (!ownerIds.length) {
    log.error('no users yet; run the main scrape first')
    process.exit(1)
  }

  const model = buildTheoreticalModel(await getGameConfig())
  const count = await scrapeFactories(ownerIds, skillByUser, model, { limit })
  log.info({ withFactories: count, path: factoriesNdjsonPath() }, 'done')
}

main().catch((err) => {
  log.error({ err }, 'failed')
  process.exit(1)
})
