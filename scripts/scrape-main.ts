import { logger } from '@/lib/log'
import { runMainScrape } from '@/lib/warera/scrape-main'

const log = logger.child({ phase: 'scrape' })

async function main() {
  const result = await runMainScrape()
  log.info({ result }, 'scrape done')
}

main().catch((err) => {
  log.error({ err }, 'scrape failed')
  process.exit(1)
})
