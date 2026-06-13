import type { FactoryRawRow, FactorySnapshot } from '@/lib/cache/factory-store'

import { factorySnapshotPath } from '@/lib/cache/factory-store'
import { readRawSnapshot, writeJsonFile } from '@/lib/cache/file-store'
import { avgCompleteStat } from '@/lib/factories/inputs'
import { getUserCompaniesSlow } from '@/lib/warera/api'

// Users hydrated concurrently. The factoryClient rate limit (20/min) is the real
// throttle; concurrency just keeps the request pipe full behind it.
const CONCURRENCY = 12

// Persist progress every N users so a crash/stop keeps most of the pass.
const WRITE_EVERY = 250

/**
 * Slow all-users factory scrape (`npm run scrape-factories`, off by default —
 * run it manually). Enumerates each company-owning user's factories on the
 * dedicated 20/min factory client and records each factory's RAW facts (item,
 * region, bonus, production points/day, wage/day, workers) to
 * `.data/factories.json`. Net/profit and potentials are NOT computed here — the
 * row builders derive those at build time from these rows plus the snapshot's
 * market data, the same way every other row derives from raw API data.
 *
 * Args: `--limit=N` scans only the first N users (for a cheap test run).
 */
async function main() {
  const limitArg = process.argv.find(a => a.startsWith('--limit='))
  const limit = limitArg ? Number(limitArg.split('=')[1]) : Number.POSITIVE_INFINITY

  const raw = await readRawSnapshot()
  if (!raw) {
    console.error('[factory-scrape] no snapshot yet; run the main scrape first')
    process.exit(1)
  }

  // Only users who own company wealth — skips the ~1.4% with none, saving a
  // wasted enumeration call each.
  let userIds = raw.users.filter(u => (u.stats?.wealth?.companies ?? 0) > 0).map(u => u._id)
  if (Number.isFinite(limit)) {
    userIds = userIds.slice(0, limit)
  }
  console.info(`[factory-scrape] scanning ${userIds.length} users at ${process.env.FACTORY_RATE_LIMIT ?? 20} req/min`)

  const out: FactorySnapshot = { byUser: {} }
  const outPath = factorySnapshotPath()
  let done = 0
  let cursor = 0

  async function worker(): Promise<void> {
    while (cursor < userIds.length) {
      const userId = userIds[cursor++]
      try {
        const factories = await getUserCompaniesSlow(userId)
        if (factories.length) {
          out.byUser[userId] = factories.map<FactoryRawRow>(f => ({
            itemCode: f.company.itemCode,
            regionId: f.company.region,
            bonusPct: f.bonus?.total ?? 0,
            pointsPerDay: avgCompleteStat(f.stats, 'total'),
            grossWagePerDay: avgCompleteStat(f.stats, 'wage'),
            workerCount: Array.isArray(f.company.workers) ? f.company.workers.length : 0,
          }))
        }
      } catch (err) {
        console.warn(`[factory-scrape] user ${userId} failed:`, (err as Error).message)
      }

      done++
      if (done % WRITE_EVERY === 0) {
        await writeJsonFile(outPath, out)
        console.info(`[factory-scrape] ${done}/${userIds.length} scanned, ${Object.keys(out.byUser).length} with factories`)
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()))

  await writeJsonFile(outPath, out)
  console.info(`[factory-scrape] done: ${Object.keys(out.byUser).length} users with factories → ${outPath}`)
}

main().catch((err) => {
  console.error('[factory-scrape] failed', err)
  process.exit(1)
})
