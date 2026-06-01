import type { SnapshotMeta } from './api'
import type { RawSnapshot } from '@/lib/cache/file-store'

import { writeRawSnapshot } from '@/lib/cache/file-store'

import { getAllBattles, getAllCountries, getAllMUs, getAllParties, getAllRegions, getEquipment, getGameConfig, getTournamentInfo, getUserIdsForCountry, getUsers } from './api'

const COUNTRY_PAGINATION_CONCURRENCY = 10

interface ScrapeResult {
  scrapedAt: string
  counts: { countries: number, users: number, mus: number, regions: number, parties: number, battles: number }
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

/**
 * Gathers the full dataset from the WarEra API and returns it in raw form. Runs
 * on the scrape client, which has its own rate-limit budget separate from the
 * urgent on-demand client, so the two never wait on each other.
 */
export async function scrapeRawSnapshot(): Promise<RawSnapshot> {
  const start = Date.now()

  // 1. Countries: single call.
  const countries = await getAllCountries()
  console.info(`[scrape] fetched ${countries.length} countries`)

  // 2. User IDs: paginate per country with bounded concurrency.
  const userIdLists = await mapWithConcurrency(
    countries.map(c => c._id),
    COUNTRY_PAGINATION_CONCURRENCY,
    countryId => getUserIdsForCountry(countryId),
  )
  const userIds = userIdLists.flat()
  console.info(`[scrape] collected ${userIds.length} user ids across ${countries.length} countries`)

  // 3. Hydrate users. Stamp each with the capture time (like MUs below) so the
  // user page can show data freshness; an on-demand refresh bumps it later.
  const usersRaw = await getUsers(userIds)
  const usersCapturedAt = new Date().toISOString()
  const users = usersRaw.map(u => ({ ...u, lastRefreshedAt: usersCapturedAt }))
  console.info(`[scrape] hydrated ${users.length} users`)

  // 3b. Per-user equipment. One HTTP call per user, batched by the tRPC client
  // up to 50 ops. Many entries come back `{}` (player stripped gear between
  // battles); kept in the snapshot as-is so readers can distinguish "captured,
  // none equipped" from "not captured".
  const equipmentList = await getEquipment(userIds)
  const equipment: Record<string, RawSnapshot['equipment'][string]> = {}
  for (let i = 0; i < userIds.length; i++) {
    equipment[userIds[i]] = equipmentList[i]
  }
  console.info(`[scrape] fetched equipment for ${equipmentList.length} users`)

  // 4. MUs: single cursor-paginated stream. Stamp each with the capture time so
  // the MU page can show data freshness; an on-demand refresh bumps it later.
  const musRaw = await getAllMUs()
  const capturedAt = new Date().toISOString()
  const mus = musRaw.map(m => ({ ...m, lastRefreshedAt: capturedAt }))
  console.info(`[scrape] fetched ${mus.length} MUs`)

  // 5. Regions: single call, returns ~700 regions as an object.
  const regions = await getAllRegions()
  console.info(`[scrape] fetched ${regions.length} regions`)

  // 6. Parties: single cursor-paginated stream.
  const parties = await getAllParties()
  console.info(`[scrape] fetched ${parties.length} parties`)

  // 7. Battles: all active plus a recent window of finished ones.
  const battles = await getAllBattles()
  console.info(`[scrape] fetched ${battles.length} battles`)

  // 7b. Tournament teams: so tournament battles (team-vs-team, no country) can
  // resolve each side to its MU. Stored as a serializable record (the live
  // shape uses a Map, which doesn't survive JSON).
  const tournament = await getTournamentInfo()
  const tournamentSnapshot = {
    id: tournament.id,
    name: tournament.name,
    teams: Object.fromEntries(tournament.teams),
  }
  console.info(`[scrape] fetched tournament "${tournament.name}" with ${tournament.teams.size} teams`)

  // 8. Game config: static catalog (item stats, skill cost curves, …). One
  // no-arg call; persisted so derived constants can read live data later.
  const gameConfig = await getGameConfig()
  console.info(`[scrape] fetched game config`)

  const durationMs = Date.now() - start
  const meta: SnapshotMeta = {
    scrapedAt: new Date().toISOString(),
    entityCounts: {
      countries: countries.length,
      users: users.length,
      mus: mus.length,
      regions: regions.length,
      parties: parties.length,
      battles: battles.length,
    },
    scrapeDurationMs: durationMs,
  }

  return { users, equipment, countries, mus, regions, parties, battles, tournament: tournamentSnapshot, gameConfig, meta }
}

/**
 * One-shot full scrape for the CLI (`npm run scrape`): gathers the dataset and
 * writes it to the snapshot file, then returns counts. The in-server scraper
 * uses {@link scrapeRawSnapshot} directly so it can also swap the in-memory
 * snapshot and loop.
 */
export async function runFullScrape(): Promise<ScrapeResult> {
  const raw = await scrapeRawSnapshot()
  await writeRawSnapshot(raw)
  console.info(`[scrape] wrote snapshot in ${raw.meta.scrapeDurationMs}ms`)

  const counts = {
    countries: raw.countries.length,
    users: raw.users.length,
    mus: raw.mus.length,
    regions: raw.regions.length,
    parties: raw.parties.length,
    battles: raw.battles.length,
  }
  return { scrapedAt: raw.meta.scrapedAt!, counts, durationMs: raw.meta.scrapeDurationMs! }
}
