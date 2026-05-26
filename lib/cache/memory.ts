import type { RawSnapshot } from './file-store'
import type { BattleRow, CountryRow, MURow, PartyRow, RegionRow, UserRow } from '@/lib/rows'
import type { Lookups } from '@/lib/rows/lookups'

import type { TournamentSnapshot } from '@/lib/warera/api'

import { buildBattleRows } from '@/lib/rows/build-battles'
import { buildCountryRows } from '@/lib/rows/build-countries'
import { buildMURows } from '@/lib/rows/build-mus'
import { buildPartyRows } from '@/lib/rows/build-parties'
import { buildRegionRows } from '@/lib/rows/build-regions'
import { buildUserRows } from '@/lib/rows/build-users'
import { buildLookups } from '@/lib/rows/lookups'

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
  countries: CountryRow[]
  mus: MURow[]
  parties: PartyRow[]
  regions: RegionRow[]
  battles: BattleRow[]
  // Kept so live, on-demand fetches (active battles) can enrich raw API data
  // against the same warm lookups the rows were built from.
  lookups: Lookups
  tournament: TournamentSnapshot
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
export function buildSnapshot(raw: RawSnapshot): Snapshot {
  const start = Date.now()

  const lookups = buildLookups(raw.countries, raw.mus, raw.regions, raw.users, raw.parties)
  const userRows = buildUserRows(raw.users, lookups)
  const countryRows = buildCountryRows(raw.countries, raw.mus, userRows, lookups)
  const muRows = buildMURows(raw.mus, userRows, lookups)
  const partyRows = buildPartyRows(raw.parties, userRows, lookups)
  const regionRows = buildRegionRows(raw.regions, lookups)
  const battleRows = buildBattleRows(raw.battles, raw.tournament, lookups)

  console.warn(`[snapshot] built rows in ${Date.now() - start}ms (${userRows.length} users)`)

  return { users: userRows, countries: countryRows, mus: muRows, parties: partyRows, regions: regionRows, battles: battleRows, lookups, tournament: raw.tournament }
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
  s.current = buildSnapshot((await readRawSnapshot()) ?? emptyRawSnapshot())
}

/**
 * The read API for every page and route. Serves the in-memory snapshot, lazily
 * loading it from the file on first use if the scraper hasn't populated it in
 * this module instance yet. A missing file yields the empty snapshot (pages
 * render a "no data" state).
 *
 * During `next build` it never reads the file, so prerendering always sees the
 * empty state; real data is served at request time on the running server.
 */
export function getSnapshot(): Promise<Snapshot> {
  const s = store()
  if (s.current) {
    return Promise.resolve(s.current)
  }
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return Promise.resolve(buildSnapshot(emptyRawSnapshot()))
  }
  if (!s.loading) {
    s.loading = readRawSnapshot()
      .then(raw => buildSnapshot(raw ?? emptyRawSnapshot()))
      .then((snapshot) => {
        s.current ??= snapshot
        s.loading = null
        return s.current
      })
  }
  return s.loading
}
