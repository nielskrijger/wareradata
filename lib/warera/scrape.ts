import type { SnapshotMeta, UserLite } from './schemas'

import { writeSnapshot, writeUsersSharded } from '@/lib/cache/snapshot'

import { getAllCountries, getAllMUs, getAllParties, getAllRegions, getUserIdsForCountry, getUserLite } from './endpoints'

const COUNTRY_PAGINATION_CONCURRENCY = 10

interface ScrapeResult {
  scrapedAt: string
  counts: { countries: number, users: number, mus: number, regions: number, parties: number }
  durationMs: number
}

/**
 * Runs the input list through `worker` with at most `limit` in flight.
 * Returns results in input order.
 */
async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  worker: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = Array.from({ length: items.length }) as R[]
  let cursor = 0
  async function next(): Promise<void> {
    while (cursor < items.length) {
      const i = cursor++
      results[i] = await worker(items[i], i)
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => next()))
  return results
}

export async function runFullScrape(): Promise<ScrapeResult> {
  const start = Date.now()
  const opts = { noCache: true }

  // 1. Countries — single call.
  const countries = await getAllCountries(opts)
  console.warn(`[scrape] fetched ${countries.length} countries`)

  // 2. User IDs — paginate per country with bounded concurrency.
  const userIdLists = await mapWithConcurrency(
    countries.map(c => c._id),
    COUNTRY_PAGINATION_CONCURRENCY,
    countryId => getUserIdsForCountry(countryId, opts),
  )
  const userIds = userIdLists.flat()
  console.warn(`[scrape] collected ${userIds.length} user ids across ${countries.length} countries`)

  // 3. Hydrate users via tRPC batch (150 per request).
  const users = await getUserLite(userIds, opts)
  console.warn(`[scrape] hydrated ${users.length} users`)

  // Group users by country for sharded storage (single SET would exceed Upstash 10MB cap).
  const usersByCountry: Record<string, UserLite[]> = {}
  for (const u of users) {
    if (!usersByCountry[u.country]) {
      usersByCountry[u.country] = []
    }
    usersByCountry[u.country].push(u)
  }

  // 4. MUs — single cursor-paginated stream.
  const mus = await getAllMUs(opts)
  console.warn(`[scrape] fetched ${mus.length} MUs`)

  // 5. Regions — single call, returns ~700 regions as an object.
  const regions = await getAllRegions(opts)
  console.warn(`[scrape] fetched ${regions.length} regions`)

  // 6. Parties — single cursor-paginated stream (returns full party objects).
  const parties = await getAllParties(opts)
  console.warn(`[scrape] fetched ${parties.length} parties`)

  const durationMs = Date.now() - start
  const scrapedAt = new Date().toISOString()
  const meta: SnapshotMeta = {
    scrapedAt,
    entityCounts: {
      countries: countries.length,
      users: users.length,
      mus: mus.length,
      regions: regions.length,
      parties: parties.length,
    },
    scrapeDurationMs: durationMs,
  }

  // 6. Write to Redis. Users are sharded; everything else fits a single key.
  await writeUsersSharded(usersByCountry)
  await Promise.all([
    writeSnapshot('countries', countries),
    writeSnapshot('mus', mus),
    writeSnapshot('regions', regions),
    writeSnapshot('parties', parties),
    writeSnapshot('meta', meta),
  ])
  console.warn(`[scrape] wrote snapshot in ${durationMs}ms`)

  return {
    scrapedAt,
    counts: {
      countries: countries.length,
      users: users.length,
      mus: mus.length,
      regions: regions.length,
      parties: parties.length,
    },
    durationMs,
  }
}
