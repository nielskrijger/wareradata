import type { FactorySnapshot } from './factory-store'
import type { RawSnapshot } from './file-store'
import type { GearLookup } from '@/lib/gear/score'
import type { Range } from '@/lib/query'
import type { AllianceRow, BattleRow, CountryRow, GovernmentRow, MURow, PartyRow, RegionRow, UserRow } from '@/lib/rows'
import type { Lookups } from '@/lib/rows/lookups'

import type { Equipment, GameConfig, TournamentSnapshot } from '@/lib/warera/api'

import { buildUserFactoryAggregates } from '@/lib/factories/aggregate'
import { recipeFromGameConfig } from '@/lib/factories/inputs'
import { deriveGearLookup } from '@/lib/gear/score'
import { computeRanges } from '@/lib/query'
import { buildAllianceRows } from '@/lib/rows/build-alliances'
import { buildBattleRows } from '@/lib/rows/build-battles'
import { buildCountryRows } from '@/lib/rows/build-countries'
import { buildGovernmentRows } from '@/lib/rows/build-governments'
import { buildMURows } from '@/lib/rows/build-mus'
import { buildPartyRows } from '@/lib/rows/build-parties'
import { buildRegionRows } from '@/lib/rows/build-regions'
import { buildUserRows } from '@/lib/rows/build-users'
import { buildLookups } from '@/lib/rows/lookups'

import { readFactorySnapshot } from './factory-store'
import { emptyRawSnapshot, readRawSnapshot } from './file-store'

// Build-time guard: fails the build if any client component ever imports this
// file (it holds the in-process snapshot and pulls in server-only builders).
import 'server-only'

/**
 * In-process snapshot of built rows, scoped to a single Node process. The
 * scrape worker owns refresh: it builds a new snapshot after each cycle (and
 * after each piecemeal patch) and swaps it in via {@link swapSnapshot}. Reads
 * are served from {@link getSnapshot} with no I/O.
 *
 * There is no TTL or stale-while-revalidate: the worker is the only writer and
 * refreshes continuously, so the in-memory copy is always the freshest the
 * scraper has produced.
 */

export interface Snapshot {
  users: UserRow[]
  // [min, max, median] per numeric UserRow field across the full user set.
  // Precomputed in buildSnapshot() so detail pages and the user-hover-card
  // tooltip can heat-tint stats against the leaderboard without re-walking
  // 16k rows per request.
  userRanges: Record<string, Range>
  // Currently-equipped gear per user id, captured by the equipment scrape
  // phase. Pass-through from RawSnapshot — the row builders don't need it,
  // but per-user views (hover-card, detail page) read it directly.
  equipment: Record<string, Equipment>
  countries: CountryRow[]
  // Resolved government per country id (president, ministers, congress), built
  // from RawSnapshot.governments + the user lookups. Read only by the country
  // detail page; absent for countries with no government.
  governments: Record<string, GovernmentRow>
  mus: MURow[]
  parties: PartyRow[]
  alliances: AllianceRow[]
  regions: RegionRow[]
  battles: BattleRow[]
  // Kept so live, on-demand fetches (active battles) can enrich raw API data
  // against the same warm lookups the rows were built from.
  lookups: Lookups
  tournament: TournamentSnapshot
  // Game's static config (item stats, skill cost curves, …), captured every
  // scrape. Pass-through from RawSnapshot; the gear roll bounds and skill cost
  // curve are derived from it.
  gameConfig: GameConfig
  // Tiny code→tier + ammo-bonus lookup derived from gameConfig. Small enough to
  // ship to the browser (via the /api/users response), so client gear components
  // resolve tiers without the full config.
  gearLookup: GearLookup
}

// Next loads server modules in several separate module graphs within one
// process (page RSC, route handlers, etc.), so a plain module-level `let` is
// NOT a process singleton: each graph gets its own copy, and a swap in one
// isn't seen by the others. Backing the state on `globalThis` gives every graph
// the same store, so the scraper's swaps and on-demand refreshes are visible to
// every page and route.
interface SnapshotStore {
  // The built snapshot the scraper keeps swapped in.
  current: Snapshot | null
  // Guards against many concurrent first-requests each loading the 68 MB file:
  // the first read kicks off one load, the rest await the same promise.
  loading: Promise<Snapshot> | null
}

const GLOBAL_KEY = Symbol.for('wareradata.snapshotStore')

function store(): SnapshotStore {
  const g = globalThis as typeof globalThis & { [GLOBAL_KEY]?: SnapshotStore }
  g[GLOBAL_KEY] ??= { current: null, loading: null }
  return g[GLOBAL_KEY]
}

/**
 * Turns a raw snapshot into built rows. Each call produces fresh arrays (the
 * builders never mutate their input), so the result is a new immutable snapshot
 * safe to publish while readers still hold an older one.
 */
export function buildSnapshot(raw: RawSnapshot, nowMs: number, factory: FactorySnapshot = { byUser: {} }): Snapshot {
  const lookups = buildLookups(raw.countries, raw.mus, raw.regions, raw.users, raw.parties)
  const gearLookup = deriveGearLookup(raw.gameConfig)

  // Value each user's factories from the raw factory rows + the snapshot's
  // market data (prices + best-region frontier), so member-agg can roll the
  // per-user totals up into the entity Industry columns. Empty when neither
  // scrape has populated its inputs yet.
  const regionName = (id: string) => lookups.regionById.get(id)?.name ?? '—'
  const factoryAggByUser = buildUserFactoryAggregates(factory, raw.prices, raw.itemBestRegions, recipeFromGameConfig(raw.gameConfig), regionName)

  const userRows = buildUserRows(raw.users, lookups, nowMs, raw.equipment, raw.gameConfig, gearLookup, factoryAggByUser)
  const countryRows = buildCountryRows(raw.countries, raw.mus, userRows, lookups, raw.alliances)
  const governmentRows = buildGovernmentRows(raw.governments, lookups)
  const muRows = buildMURows(raw.mus, userRows, lookups)
  const partyRows = buildPartyRows(raw.parties, userRows, lookups)
  const allianceRows = buildAllianceRows(raw.alliances, countryRows, userRows, lookups)
  const regionRows = buildRegionRows(raw.regions, lookups)
  const battleRows = buildBattleRows(raw.battles, raw.tournament, lookups)
  const userRanges = computeRanges(userRows)

  return { users: userRows, userRanges, equipment: raw.equipment, countries: countryRows, governments: governmentRows, mus: muRows, parties: partyRows, alliances: allianceRows, regions: regionRows, battles: battleRows, lookups, tournament: raw.tournament, gameConfig: raw.gameConfig, gearLookup }
}

/**
 * Builds a snapshot at the current time and logs the duration. Use at the
 * boot / scrape paths (worker context, never during prerender) — keeping the
 * Date.now() and timing log out of {@link buildSnapshot} itself lets that
 * function be called from a prerender path without tripping the
 * cacheComponents current-time check.
 */
export function buildSnapshotNow(raw: RawSnapshot, label: string, factory: FactorySnapshot = { byUser: {} }): Snapshot {
  const start = Date.now()
  const snapshot = buildSnapshot(raw, start, factory)
  console.info(`[snapshot] ${label}: built rows in ${Date.now() - start}ms (${snapshot.users.length} users)`)
  return snapshot
}

/**
 * Publishes a freshly built snapshot. A single reference assignment, atomic in
 * JS's single-threaded model: a reader either sees the old snapshot or the new
 * one, never a half-applied state.
 */
export function swapSnapshot(next: Snapshot): void {
  store().current = next
}

/**
 * Loads the persisted snapshot into memory once at boot. The instrumentation
 * hook awaits this before the server serves requests, so the first request
 * already sees real (or empty, on a cold volume) data. Idempotent.
 */
export async function initSnapshot(): Promise<void> {
  const s = store()
  if (s.current) {
    return
  }
  console.info('[snapshot] boot: loading persisted snapshot from disk')
  const [raw, factory] = await Promise.all([readRawSnapshot(), readFactorySnapshot()])
  if (!raw) {
    console.info('[snapshot] boot: no persisted data, starting empty until the scraper completes its first cycle')
  }
  s.current = buildSnapshotNow(raw ?? emptyRawSnapshot(), 'boot', factory)
  console.info(`[snapshot] boot: ready with ${s.current.users.length} users`)
}

/**
 * The read API for every page and route. Serves the in-memory snapshot, lazily
 * loading it from the file on first use if the scraper hasn't populated it in
 * this module instance yet. A missing file yields the empty snapshot (pages
 * render a "no data" state).
 *
 * All pages that read this go through `await connection()` first, so prerender
 * (where the snapshot is empty) is never reached — this is only called for
 * request-time renders.
 */
export function getSnapshot(): Promise<Snapshot> {
  const s = store()
  if (s.current) {
    return Promise.resolve(s.current)
  }
  if (!s.loading) {
    s.loading = Promise.all([readRawSnapshot(), readFactorySnapshot()])
      .then(([raw, factory]) => buildSnapshotNow(raw ?? emptyRawSnapshot(), 'lazy-load', factory))
      .then((snapshot) => {
        s.current ??= snapshot
        s.loading = null
        return s.current
      })
  }
  return s.loading
}
