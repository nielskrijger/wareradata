import type { FactoryRawRow } from '@/lib/cache/factory-store'
import type { EngineModel } from '@/lib/factories/engine'

import { factoriesNdjsonPath } from '@/lib/cache/factory-store'
import { writeFileAtomic } from '@/lib/cache/ndjson'
import { factoryInputFromData } from '@/lib/factories/inputs'
import { logger, memoryUsage } from '@/lib/log'

import { FACTORY_RATE_LIMIT, getUserCompaniesSlow } from './api'

const log = logger.child({ component: 'factory-scrape' })

// Users hydrated concurrently. The factory client's rate limit is the real
// throttle; concurrency just keeps the request pipe full behind it. Kept low so
// the in-flight payloads stay small on a memory-tight box.
const CONCURRENCY = 6

// How often to emit a progress line (every N users scanned). A full pass is
// thousands of users over hours, so log frequently enough to see it advancing.
const PROGRESS_EVERY = 250

/**
 * The all-users factory pass on the slow factory client: for each company-owning
 * user, enumerate their factories with their NPC employee rosters, and record
 * each factory's daily production per source (the engine at its level, the
 * employees from the roster's hourly estimate) and its wages. `model` carries the
 * engine output per level. Net and the Top potential are NOT computed here — the
 * readers derive those at build time from these points plus the snapshot's
 * market data.
 *
 * Streams NDJSON (one user per line) to a temp file, then renames over
 * `factories.ndjson` once the pass completes — so it holds no accumulator in
 * memory, and a crashed/partial pass leaves the previous file intact. Shared by
 * the manual `npm run scrape-factories` script. Takes the pre-filtered list of
 * company-owning user ids (see `loadFactoryScrapeInputs`). Returns the count of
 * users found to own factories.
 */
export async function scrapeFactories(
  userIds: string[],
  model: EngineModel,
  opts: { limit?: number } = {},
): Promise<number> {
  const ids = opts.limit && Number.isFinite(opts.limit) ? userIds.slice(0, opts.limit) : userIds
  log.info({ users: ids.length, rateLimit: FACTORY_RATE_LIMIT }, 'scanning users')

  let withFactories = 0
  let done = 0
  let cursor = 0

  // writeFileAtomic streams to a temp file and renames over factories.ndjson once
  // every worker drains, so a crashed/partial pass leaves the previous file
  // intact and nothing is accumulated in memory.
  await writeFileAtomic(factoriesNdjsonPath(), async (write) => {
    async function worker(): Promise<void> {
      while (cursor < ids.length) {
        const userId = ids[cursor++]
        try {
          const factories = await getUserCompaniesSlow(userId)
          if (factories.length) {
            const rows = factories.map<FactoryRawRow>((f) => {
              const input = factoryInputFromData(f, () => '', model)
              return {
                itemCode: input.itemCode,
                regionId: f.company.region,
                enginePoints: input.enginePointsPerDay,
                employeePoints: input.employeePointsPerDay,
                wagePerDay: input.wagePerDay,
                managerPerDay: input.managerPerDay,
                employeeCount: input.employeeCount,
                employeeCap: input.employeeCap,
              }
            })
            await write(`${JSON.stringify({ userId, rows })}\n`)
            withFactories++
          }
        } catch (err) {
          log.warn({ userId, err }, 'user failed')
        }

        done++
        if (done % PROGRESS_EVERY === 0) {
          log.info({ scanned: done, total: ids.length, withFactories, ...memoryUsage() }, 'progress')
        }
      }
    }

    await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()))
  })

  return withFactories
}
