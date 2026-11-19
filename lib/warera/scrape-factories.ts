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
 * Records each owner's factories with production per source, wages and a
 * trimmed roster; net is derived at build time from market data.
 *
 * Streams to a temp file and renames when the pass completes, so nothing
 * accumulates in memory and a crashed pass keeps the previous file.
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
            ...(input.disabled && { disabled: true as const }),
            ...(f.hourly ? { employees: f.employees.map(trimEmployee) } : { rosterMissing: true as const }),
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
