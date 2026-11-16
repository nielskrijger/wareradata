import type { FactoryRawEmployee, FactoryRawRow } from '@/lib/cache/factory-store'
import type { EngineModel } from '@/lib/factories/engine'
import type { Employee } from '@/lib/warera/api'

import { once } from 'node:events'
import { createWriteStream } from 'node:fs'
import { mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { factoriesCursorPath, factoriesNdjsonPath, factoriesPartialPath } from '@/lib/cache/factory-store'
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
 * The owner id a pass interrupted by a restart stopped after, or null to start fresh.
 */
async function readCursor(): Promise<string | null> {
  try {
    return (await readFile(factoriesCursorPath(), 'utf8')).trim() || null
  } catch {
    return null
  }
}

/**
 * Records each owner's factories with production per source, wages and a
 * trimmed roster; net is derived at build time from market data.
 *
 * A pass takes hours and the server restarts on every deploy, so it appends to
 * a partial file and resumes after the saved cursor instead of starting over.
 * The partial file replaces factories.ndjson only once the pass completes.
 */
export async function scrapeFactories(
  userIds: string[],
  model: EngineModel,
  opts: { limit?: number } = {},
): Promise<number> {
  // Sorted, so the cursor means the same position after a restart.
  const sorted = [...userIds].sort()
  const all = opts.limit && Number.isFinite(opts.limit) ? sorted.slice(0, opts.limit) : sorted
  const cursor = await readCursor()
  const ids = cursor ? all.filter(id => id > cursor) : all
  log.info({ users: ids.length, resumedAfter: cursor, rateLimit: FACTORY_RATE_LIMIT }, 'scanning users')

  const partialPath = factoriesPartialPath()
  await mkdir(path.dirname(partialPath), { recursive: true })
  const out = createWriteStream(partialPath, { encoding: 'utf8', flags: cursor ? 'a' : 'w' })
  // Resolves once the chunk reaches the file, so the cursor never runs ahead of it.
  const write = (chunk: string) => new Promise<void>((resolve, reject) => {
    out.write(chunk, err => (err ? reject(err) : resolve()))
  })

  // Ends a line torn by the crash, so the first appended record still parses.
  if (cursor) {
    await write('\n')
  }

  let withFactories = 0
  let done = 0

  try {
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
            ...(f.hourly ? { employees: f.employees.map(trimEmployee) } : { rosterMissing: true as const }),
          }
        })

        await write(`${JSON.stringify({ userId: chunk[i], rows })}\n`)
        withFactories++
      }

      // Lines past the cursor may be written again after a crash; the loader
      // keeps the last line per user, so a repeat is harmless.
      await writeFile(factoriesCursorPath(), chunk[chunk.length - 1])

      const before = done
      done += chunk.length
      if (Math.floor(done / PROGRESS_EVERY) > Math.floor(before / PROGRESS_EVERY)) {
        log.info({ scanned: done, total: ids.length, withFactories, ...memoryUsage() }, 'progress')
      }
    }

    out.end()
    await once(out, 'finish')
  } catch (err) {
    out.destroy()
    throw err
  }

  await rename(partialPath, factoriesNdjsonPath())
  await unlink(factoriesCursorPath()).catch(() => undefined)

  return withFactories
}
