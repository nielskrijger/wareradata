import { runFullScrape } from '@/lib/warera/scrape'

async function main() {
  const result = await runFullScrape()
  console.warn('[scrape] done', JSON.stringify(result))
}

main().catch((err) => {
  console.error('[scrape] failed', err)
  process.exit(1)
})
