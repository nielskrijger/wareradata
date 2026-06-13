import type { User } from './api'
import type { FactoryRawRow, FactorySnapshot } from '@/lib/cache/factory-store'

import { factorySnapshotPath } from '@/lib/cache/factory-store'
import { writeJsonFile } from '@/lib/cache/file-store'
import { avgCompleteStat } from '@/lib/factories/inputs'

import { getUserCompaniesSlow } from './api'

// Users hydrated concurrently. The factory client's rate limit (20/min) is the
// real throttle; concurrency just keeps the request pipe full behind it.
const CONCURRENCY = 12

// Persist progress every N users so a crash/stop keeps most of the pass.
const WRITE_EVERY = 250

/**
 * The all-users factory pass on the slow factory client: enumerate each
 * company-owning user's factories and record each factory's RAW facts (item,
 * region, bonus, production points/day, wage/day, workers) to `.data/factories.json`.
 * Net/profit and potentials are NOT computed here — the row builders derive
 * those at build time from these rows plus the snapshot's market data.
 *
 * Shared by the continuous factory loop ({@link startScraper}) and the manual
 * `npm run scrape-factories` script. Writes incrementally; returns the count of
 * users found to own factories.
 */
export async function scrapeAllFactories(users: User[], opts: { limit?: number } = {}): Promise<number> {
  // Only users who own company wealth — skips the ~1.4% with none, saving a
  // wasted enumeration call each.
  let userIds = users.filter(u => (u.stats?.wealth?.companies ?? 0) > 0).map(u => u._id)
  if (opts.limit && Number.isFinite(opts.limit)) {
    userIds = userIds.slice(0, opts.limit)
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
  return Object.keys(out.byUser).length
}
