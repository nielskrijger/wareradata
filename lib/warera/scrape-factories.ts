import type { FactoryRawEmployee, FactoryRawRow } from '@/lib/cache/factory-store'
import type { EngineModel } from '@/lib/factories/engine'
import type { Employee } from '@/lib/warera/api'

import { factoriesNdjsonPath } from '@/lib/cache/factory-store'
import { writeFileAtomic } from '@/lib/cache/ndjson'
import { factoryInputFromData } from '@/lib/factories/inputs'
import { logger, memoryUsage } from '@/lib/log'

import { FACTORY_RATE_LIMIT, getUserCompaniesSlow } from './api'

const log = logger.child({ component: 'factory-scrape' })

/**
 * Owners fetched at once, so their calls share batched requests.
 */
const CHUNK_SIZE = 50

/**
 * How often to emit a progress line (every N users scanned). A full pass is
 * thousands of users over hours, so log frequently enough to see it advancing.
 */
const PROGRESS_EVERY = 250

function trimEmployee(e: Employee): FactoryRawEmployee {
  return {
    production: e.breakdown?.production?.total ?? 0,
    luck: e.breakdown?.luck?.total ?? 0,
    responsibility: e.breakdown?.responsibility?.total ?? 0,
    potential: e.potential,
    potentialMax: e.potentialMax,
    happiness: e.happinessBreakdown?.value ?? 0,
    bonusPct: e.productionBonus?.total ?? 0,
    age: e.age,
    retireInDays: e.retireInDays,
    wagePerHour: e.estimate?.wage ?? e.wage ?? 0,
    pointsPerHour: e.estimate?.production ?? 0,
  }
}

/**
 * The all-users factory pass on the slow factory client: for each company-owning
 * user, enumerate their factories with their NPC employee rosters, and record
 * each factory's daily production per source (the engine at its level, the
 * employees from the roster's hourly estimate), its wages and a trimmed copy of
 * the roster. `model` carries the
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

  // writeFileAtomic streams to a temp file and renames over factories.ndjson once
  // every chunk is written, so a crashed/partial pass leaves the previous file
  // intact and nothing is accumulated in memory.
  await writeFileAtomic(factoriesNdjsonPath(), async (write) => {
    for (let start = 0; start < ids.length; start += CHUNK_SIZE) {
      const chunk = ids.slice(start, start + CHUNK_SIZE)
      const results = await Promise.all(chunk.map(userId => getUserCompaniesSlow(userId).catch((err) => {
        log.warn({ userId, err }, 'user failed')

        return []
      })))

      for (let i = 0; i < chunk.length; i++) {
        const factories = results[i]
        if (!factories.length) {
          continue
        }

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
            ...(f.hourly
              ? { employees: f.employees.map(trimEmployee) }
              : { rosterMissing: true as const }),
          }
        })

        await write(`${JSON.stringify({ userId: chunk[i], rows })}\n`)
        withFactories++
      }

      const before = done
      done += chunk.length
      if (Math.floor(done / PROGRESS_EVERY) > Math.floor(before / PROGRESS_EVERY)) {
        log.info({ scanned: done, total: ids.length, withFactories, ...memoryUsage() }, 'progress')
      }
    }
  })

  return withFactories
}
