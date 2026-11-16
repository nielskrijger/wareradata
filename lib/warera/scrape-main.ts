import type { Government, SnapshotMeta, StrategicBonuses } from './api'
import type { RawSnapshot } from '@/lib/cache/file-store'

import { loadEquipmentByIds, writeEquipmentNdjson } from '@/lib/cache/equipment-store'
import { writeRawSnapshot } from '@/lib/cache/file-store'
import { loadUsersByIds, writeUsersNdjson } from '@/lib/cache/users-store'

import { logger } from '@/lib/log'

import {
  getAllAlliances,
  getAllBattles,
  getAllCountries,
  getAllMUs,
  getAllParties,
  getAllRegions,
  getEquipment,
  getGameConfig,
  getGovernmentForCountry,
  getStrategicBonusesForCountry,
  getTournamentInfo,
  getUserIdsForCountry,
  getUsers,
  scrapeItemPrices,
  takeRetryStats,
} from './api'

const log = logger.child({ component: 'scrape' })

interface ScrapeResult {
  scrapedAt: string
  counts: {
    countries: number
    users: number
    mus: number
    regions: number
    parties: number
    alliances: number
    battles: number
  }
  durationMs: number
}

/**
 * Gathers the full dataset from the WarEra API and returns it in raw form. Runs
 * on the scrape client, which has its own rate-limit budget separate from the
 * urgent on-demand client, so the two never wait on each other.
 *
 * Per-entity calls are all made at once: the client packs them 50 to a request
 * and its rate limiter paces them. `previous` fills in entities whose fetch failed.
 */
export async function scrapeMain(previous?: RawSnapshot | null): Promise<RawSnapshot> {
  const start = Date.now()

  // 1. Countries: single call.
  const countries = await getAllCountries()
  log.info({ countries: countries.length }, 'fetched countries')

  const countryIds = countries.map(c => c._id)

  // 2. Governments: one call per country (no bulk endpoint). Dormant or
  // unoccupied countries have no government: the call may error or return an
  // all-empty record, and either way we drop it from the map.
  const governmentList = await Promise.all(countryIds.map(id => getGovernmentForCountry(id).catch(() => null)))
  const governments: RawSnapshot['governments'] = {}
  countryIds.forEach((id, i) => {
    const gov = governmentList[i]
    if (gov && hasGovernment(gov)) {
      governments[id] = gov
    }
  })
  log.info({ governments: Object.keys(governments).length, countries: countries.length }, 'fetched governments')

  // 2b. Strategic resource bonuses: one call per country. Members of an
  // alliance get the alliance-wide bonus, so the alliance page reads it off any
  // member. Countries holding no resource answer null and are left out.
  const bonusList = await Promise.all(countryIds.map(id => getStrategicBonusesForCountry(id).catch(() => undefined)))
  const bonuses = await keepPrevious('strategic bonuses', countryIds, bonusList, failed =>
    new Map(Object.entries(previous?.strategicBonuses ?? {}).filter(([id]) => failed.has(id))))
  const strategicBonuses: Record<string, StrategicBonuses> = {}
  for (const [id, bonus] of bonuses) {
    if (bonus) {
      strategicBonuses[id] = bonus
    }
  }
  log.info({ countries: Object.keys(strategicBonuses).length }, 'fetched strategic resource bonuses')

  // 3. User IDs, paginated per country.
  const userIdLists = await Promise.all(countryIds.map(id => getUserIdsForCountry(id)))
  const userIds = userIdLists.flat()
  log.info({ userIds: userIds.length, countries: countries.length }, 'collected user ids')

  // 4. Hydrate users, stamped with the capture time so the user page can show
  // data freshness.
  //
  // Streamed to users.ndjson rather than kept in the RawSnapshot: it's the
  // biggest collection (~84 MB), so keeping it off the heap is the main memory win.
  //
  // Failed fetches keep their previous line so a hiccup doesn't drop users.
  const usersRaw = await getUsers(userIds)
  const usersCapturedAt = new Date().toISOString()
  const stamped = usersRaw.map(u => u && { ...u, lastRefreshedAt: usersCapturedAt })
  const users = [...(await keepPrevious('users', userIds, stamped, loadUsersByIds)).values()]
  await writeUsersNdjson(users)
  log.info({ users: users.length }, 'hydrated users')

  // 5. Per-user equipment, streamed to equipment.ndjson to keep ~14 MB off the
  // snapshot and the heap.
  //
  // Users wearing nothing still get a `{}` line, so readers can tell "none
  // equipped" from "not captured".
  //
  // Failed fetches keep their previous line so a hiccup doesn't drop users.
  const equipment = await keepPrevious('equipment', userIds, await getEquipment(userIds), loadEquipmentByIds)
  await writeEquipmentNdjson([...equipment.keys()], [...equipment.values()])
  log.info({ users: equipment.size }, 'wrote equipment file')

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

  // 13. Market context for factory profit: current item prices, one request.
  // Stored so the row builders value factories at build time with no network.
  const prices = await scrapeItemPrices()
  log.info({ items: Object.keys(prices).length }, 'fetched prices')

  const durationMs = Date.now() - start
  log.info({ durationMs, ...takeRetryStats('scrape') }, 'scrape client retries this cycle')
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

  return {
    countries,
    governments,
    strategicBonuses,
    mus,
    regions,
    parties,
    alliances,
    battles,
    tournament: tournamentSnapshot,
    gameConfig,
    prices,
    meta,
  }
}

/**
 * Fills failed (undefined) results from the previous capture, so a hiccup
 * doesn't drop entities from the snapshot. Returns results keyed by id, in order.
 */
async function keepPrevious<T>(
  phase: string,
  ids: string[],
  results: (T | undefined)[],
  loadPrevious: (failed: Set<string>) => Map<string, T> | Promise<Map<string, T>>,
): Promise<Map<string, T>> {
  const failed = new Set(ids.filter((_, i) => results[i] === undefined))
  const previous = failed.size ? await loadPrevious(failed) : new Map<string, T>()
  if (failed.size) {
    log.warn({ phase, failed: failed.size, keptPrevious: previous.size }, 'fetches failed after retries')
  }

  const out = new Map<string, T>()
  ids.forEach((id, i) => {
    const value = results[i] !== undefined ? results[i] : previous.get(id)
    if (value !== undefined) {
      out.set(id, value)
    }
  })
  return out
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
    || g.ministers?.length
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
    users: raw.meta.entityCounts?.users ?? 0,
    mus: raw.mus.length,
    regions: raw.regions.length,
    parties: raw.parties.length,
    alliances: raw.alliances.length,
    battles: raw.battles.length,
  }
  return { scrapedAt: raw.meta.scrapedAt!, counts, durationMs: raw.meta.scrapeDurationMs! }
}
