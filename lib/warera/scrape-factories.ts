import type { User } from './api'
import type { FactoryRawRow } from '@/lib/cache/factory-store'

import { once } from 'node:events'
import { createWriteStream } from 'node:fs'
import { rename, unlink } from 'node:fs/promises'

import { factoriesNdjsonPath } from '@/lib/cache/factory-store'
import { avgCompleteStat } from '@/lib/factories/inputs'

import { getUserCompaniesSlow } from './api'

// Users hydrated concurrently. The factory client's rate limit (20/min) is the
// real throttle; concurrency just keeps the request pipe full behind it. Kept
// low so the in-flight payloads stay small on a memory-tight box.
const CONCURRENCY = 6

/**
 * The all-users factory pass on the slow factory client: enumerate each
 * company-owning user's factories and record each factory's RAW facts (item,
 * region, bonus, production points/day, wage/day, workers). Net/profit and
 * potentials are NOT computed here — the row builders derive those at build time
 * from these rows plus the snapshot's market data.
 *
 * Streams NDJSON (one user per line) to a temp file, then renames over
 * `factories.ndjson` once the pass completes — so it holds no accumulator in
 * memory, and a crashed/partial pass leaves the previous file intact. Shared by
 * the manual `npm run scrape-factories` script. Returns the count of users found
 * to own factories.
 */
export async function scrapeAllFactories(users: User[], opts: { limit?: number } = {}): Promise<number> {
  // Only users who own company wealth — skips the ~1.4% with none, saving a
  // wasted enumeration call each.
  let userIds = users.filter(u => (u.stats?.wealth?.companies ?? 0) > 0).map(u => u._id)
  if (opts.limit && Number.isFinite(opts.limit)) {
    userIds = userIds.slice(0, opts.limit)
  }
  console.info(`[factory-scrape] scanning ${userIds.length} users at ${process.env.FACTORY_RATE_LIMIT ?? 20} req/min`)

  const finalPath = factoriesNdjsonPath()
  const tmpPath = `${finalPath}.tmp.${process.pid}.${Date.now()}`
  const out = createWriteStream(tmpPath, { encoding: 'utf8' })

  let withFactories = 0
  let done = 0
  let cursor = 0

  async function write(line: string): Promise<void> {
    if (!out.write(line)) {
      await once(out, 'drain')
    }
  }

  async function worker(): Promise<void> {
    while (cursor < userIds.length) {
      const userId = userIds[cursor++]
      try {
        const factories = await getUserCompaniesSlow(userId)
        if (factories.length) {
          const rows = factories.map<FactoryRawRow>(f => ({
            itemCode: f.company.itemCode,
            regionId: f.company.region,
            bonusPct: f.bonus?.total ?? 0,
            pointsPerDay: avgCompleteStat(f.stats, 'total'),
            grossWagePerDay: avgCompleteStat(f.stats, 'wage'),
            workerCount: Array.isArray(f.company.workers) ? f.company.workers.length : 0,
          }))
          await write(`${JSON.stringify({ userId, rows })}\n`)
          withFactories++
        }
      } catch (err) {
        console.warn(`[factory-scrape] user ${userId} failed:`, (err as Error).message)
      }

      done++
      if (done % 1000 === 0) {
        console.info(`[factory-scrape] ${done}/${userIds.length} scanned, ${withFactories} with factories`)
      }
    }
  }

  try {
    await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()))
    out.end()
    await once(out, 'finish')
    await rename(tmpPath, finalPath)
  } catch (err) {
    out.destroy()
    await unlink(tmpPath).catch(() => undefined)
    throw err
  }

  return withFactories
}
