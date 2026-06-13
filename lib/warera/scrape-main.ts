import type { Government, SnapshotMeta } from './api'
import type { RawSnapshot } from '@/lib/cache/file-store'

import { writeEquipmentNdjson } from '@/lib/cache/equipment-store'
import { writeRawSnapshot } from '@/lib/cache/file-store'

import { recipeFromGameConfig } from '@/lib/factories/inputs'
import { logger } from '@/lib/log'

import { getAllAlliances, getAllBattles, getAllCountries, getAllMUs, getAllParties, getAllRegions, getEquipment, getGameConfig, getGovernmentForCountry, getTournamentInfo, getUserIdsForCountry, getUsers, scrapeItemBestRegions, scrapeItemPrices } from './api'

const log = logger.child({ phase: 'scrape' })

const COUNTRY_PAGINATION_CONCURRENCY = 10

interface ScrapeResult {
  scrapedAt: string
  counts: { countries: number, users: number, mus: number, regions: number, parties: number, alliances: number, battles: number }
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
export async function scrapeMain(): Promise<RawSnapshot> {
  const start = Date.now()

  // 1. Countries: single call.
  const countries = await getAllCountries()
  log.info({ countries: countries.length }, 'fetched countries')

  // 2. Governments: one call per country (no bulk endpoint), fanned out with
  // the same bounded concurrency as the user-id pagination. Dormant or
  // unoccupied countries have no government: the call may error or return an
  // all-empty record, and either way we drop it from the map.
  const governmentList = await mapWithConcurrency(
    countries.map(c => c._id),
    COUNTRY_PAGINATION_CONCURRENCY,
    async (countryId) => {
      try {
        return await getGovernmentForCountry(countryId)
      } catch {
        return null
      }
    },
  )
  const governments: RawSnapshot['governments'] = {}
  for (let i = 0; i < countries.length; i++) {
    const gov = governmentList[i]
    if (gov && hasGovernment(gov)) {
      governments[countries[i]._id] = gov
    }
  }
  log.info({ governments: Object.keys(governments).length, countries: countries.length }, 'fetched governments')

  // 3. User IDs: paginate per country with bounded concurrency.
  const userIdLists = await mapWithConcurrency(
    countries.map(c => c._id),
    COUNTRY_PAGINATION_CONCURRENCY,
    countryId => getUserIdsForCountry(countryId),
  )
  const userIds = userIdLists.flat()
  log.info({ userIds: userIds.length, countries: countries.length }, 'collected user ids')

  // 4. Hydrate users. Stamp each with the capture time (like MUs below) so the
  // user page can show data freshness; an on-demand refresh bumps it later.
  const usersRaw = await getUsers(userIds)
  const usersCapturedAt = new Date().toISOString()
  const users = usersRaw.map(u => ({ ...u, lastRefreshedAt: usersCapturedAt }))
  log.info({ users: users.length }, 'hydrated users')

  // 5. Per-user equipment. One HTTP call per user, batched by the tRPC client
  // up to 50 ops. Streamed straight to a separate equipment.ndjson file (not held
  // in the RawSnapshot), keeping ~14 MB out of snapshot.json and off the
  // scraper's resident heap; the build streams it back for gear scoring. Many
  // entries come back `{}` (player stripped gear between battles); a line is
  // written for each so readers can tell "captured, none equipped" from "not
  // captured".
  const equipmentList = await getEquipment(userIds)
  await writeEquipmentNdjson(userIds, equipmentList)
  log.info({ users: equipmentList.length }, 'wrote equipment file')

  // 6. MUs: single cursor-paginated stream. Stamp each with the capture time so
  // the MU page can show data freshness; an on-demand refresh bumps it later.
  const musRaw = await getAllMUs()
  const capturedAt = new Date().toISOString()
  const mus = musRaw.map(m => ({ ...m, lastRefreshedAt: capturedAt }))
  log.info({ mus: mus.length }, 'fetched MUs')

  // 7. Regions: single call, returns ~700 regions as an object.
  const regions = await getAllRegions()
  log.info({ regions: regions.length }, 'fetched regions')

  // 8. Parties: single cursor-paginated stream.
  const parties = await getAllParties()
  log.info({ parties: parties.length }, 'fetched parties')

  // 9. Alliances: single cursor-paginated stream (currently ~10 of them, so
  // one page in practice).
  const alliances = await getAllAlliances()
  log.info({ alliances: alliances.length }, 'fetched alliances')

  // 10. Battles: all active plus a recent window of finished ones.
  const battles = await getAllBattles()
  log.info({ battles: battles.length }, 'fetched battles')

  // 11. Tournament teams: so tournament battles (team-vs-team, no country) can
  // resolve each side to its MU. Stored as a serializable record (the live
  // shape uses a Map, which doesn't survive JSON).
  const tournament = await getTournamentInfo()
  const tournamentSnapshot = {
    id: tournament.id,
    name: tournament.name,
    teams: Object.fromEntries(tournament.teams),
  }
  log.info({ tournament: tournament.name, teams: tournament.teams.size }, 'fetched tournament')

  // 12. Game config: static catalog (item stats, skill cost curves, …). One
  // no-arg call; persisted so derived constants can read live data later.
  const gameConfig = await getGameConfig()
  log.info('fetched game config')

  // 13. Market context for factory profit: current prices + the best-region
  // bonus per producible item. ~2 requests (prices, plus the per-item region
  // calls batched into one). Stored so the row builders value factories at build
  // time with no network.
  const recipeCodes = Object.keys(recipeFromGameConfig(gameConfig))
  const [prices, itemBestRegions] = await Promise.all([
    scrapeItemPrices(),
    scrapeItemBestRegions(recipeCodes),
  ])
  log.info({ items: Object.keys(itemBestRegions).length }, 'fetched prices + best regions')

  const durationMs = Date.now() - start
  const meta: SnapshotMeta = {
    scrapedAt: new Date().toISOString(),
    entityCounts: {
      countries: countries.length,
      users: users.length,
      mus: mus.length,
      regions: regions.length,
      parties: parties.length,
      alliances: alliances.length,
      battles: battles.length,
    },
    scrapeDurationMs: durationMs,
  }

  return { users, countries, governments, mus, regions, parties, alliances, battles, tournament: tournamentSnapshot, gameConfig, prices, itemBestRegions, meta }
}

/**
 * Whether a government record has any occupant worth keeping. The endpoint
 * returns all-empty-string offices and an empty congress for unoccupied
 * countries; those carry no information, so we drop them from the snapshot.
 */
function hasGovernment(g: Government): boolean {
  return Boolean(
    g.president
    || g.vicePresident
    || g.minOfDefense
    || g.minOfEconomy
    || g.minOfForeignAffairs
    || g.congressMembers?.length,
  )
}

/**
 * One-shot main scrape for the CLI (`npm run scrape-main`): gathers the dataset and
 * writes it to the snapshot file, then returns counts. The in-server scraper
 * uses {@link scrapeMain} directly so it can also swap the in-memory
 * snapshot and loop.
 */
export async function runMainScrape(): Promise<ScrapeResult> {
  const raw = await scrapeMain()
  await writeRawSnapshot(raw)
  log.info({ durationMs: raw.meta.scrapeDurationMs }, 'wrote snapshot')

  const counts = {
    countries: raw.countries.length,
    users: raw.users.length,
    mus: raw.mus.length,
    regions: raw.regions.length,
    parties: raw.parties.length,
    alliances: raw.alliances.length,
    battles: raw.battles.length,
  }
  return { scrapedAt: raw.meta.scrapedAt!, counts, durationMs: raw.meta.scrapeDurationMs! }
}
