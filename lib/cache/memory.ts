import type { RawSnapshot } from './file-store'
import type { UserFactoryAgg } from '@/lib/factories/profit'
import type { GearLookup } from '@/lib/gear/score'
import type { Range } from '@/lib/query'
import type {
  AllianceRow,
  BattleRow,
  CountryRow,
  GovernmentRow,
  MURow,
  PartyRow,
  RegionRow,
  StrategicBonusRow,
  UserRow,
} from '@/lib/rows'
import type { Lookups } from '@/lib/rows/lookups'

import type { Equipment, GameConfig, TournamentSnapshot, User } from '@/lib/warera/api'

import { loadFactoryAggregates } from '@/lib/factories/aggregate'
import { deriveGearLookup } from '@/lib/gear/score'
import { logger } from '@/lib/log'
import { computeRanges } from '@/lib/query'
import { buildAllianceRows } from '@/lib/rows/build-alliances'
import { buildBattleRows } from '@/lib/rows/build-battles'
import { buildCountryRows } from '@/lib/rows/build-countries'
import { buildGovernmentRows } from '@/lib/rows/build-governments'
import { buildMURows } from '@/lib/rows/build-mus'
import { buildPartyRows } from '@/lib/rows/build-parties'
import { buildRegionRows } from '@/lib/rows/build-regions'
import { buildStrategicRows } from '@/lib/rows/build-strategic'
import { buildUserRows } from '@/lib/rows/build-users'
import { buildBaseLookups } from '@/lib/rows/lookups'

import { loadEquipmentByUser } from './equipment-store'
import { emptyRawSnapshot, readRawSnapshot } from './file-store'
import { streamUsers } from './users-store'

// Build-time guard: fails the build if any client component ever imports this
// file (it holds the in-process snapshot and pulls in server-only builders).
import 'server-only'

const log = logger.child({ component: 'snapshot' })

/**
 * The built rows, served from memory. The scraper is the only writer and swaps
 * in a new snapshot after every cycle or refresh, so there is no TTL.
 */

export interface Snapshot {
  users: UserRow[]

  /**
   * [min, max, median] per numeric UserRow field, precomputed so detail pages
   * and hover cards don't re-walk every user per request.
   */
  userRanges: Record<string, Range>
  countries: CountryRow[]

  /**
   * Resolved government per country id (president, ministers, congress), built
   * from RawSnapshot.governments + the user lookups. Read only by the country
   * detail page; absent for countries with no government.
   */
  governments: Record<string, GovernmentRow>

  /**
   * Strategic resource bonuses by country id and by alliance id (all members
   * of an alliance share one). Empty when the snapshot has none.
   */
  strategicBonuses: {
    byCountry: Record<string, StrategicBonusRow>
    byAlliance: Record<string, StrategicBonusRow>
  }
  mus: MURow[]
  parties: PartyRow[]
  alliances: AllianceRow[]
  regions: RegionRow[]
  battles: BattleRow[]

  /**
   * Kept so live, on-demand fetches (active battles) can enrich raw API data
   * against the same warm lookups the rows were built from.
   */
  lookups: Lookups
  tournament: TournamentSnapshot

  /**
   * Game's static config (item stats, skill cost curves, …), captured every
   * scrape. Pass-through from RawSnapshot; the gear roll bounds and skill cost
   * curve are derived from it.
   */
  gameConfig: GameConfig

  /**
   * Tiny code→tier + ammo-bonus lookup derived from gameConfig. Small enough to
   * ship to the browser (via the /api/users response), so client gear components
   * resolve tiers without the full config.
   */
  gearLookup: GearLookup

  /**
   * Each user's gear as JSON text, a fraction of the memory of ~17k parsed
   * loadouts. No entry means not captured; `'{}'` means nothing equipped.
   */
  equipmentJsonByUser: Map<string, string>

  /**
   * Null before the first main cycle.
   */
  scrapedAt: string | null
}

/**
 * Lives on `globalThis` because Next loads server modules in several module
 * graphs per process, and a module-level `let` would give each its own copy.
 */
interface SnapshotStore {
  /**
   * The built snapshot the scraper keeps swapped in.
   */
  current: Snapshot | null

  /**
   * Guards against many concurrent first-requests each building from disk
   * (reading the snapshot + streaming users.ndjson): the first read kicks off one
   * load, the rest await the same promise.
   */
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
async function buildSnapshot(
  raw: RawSnapshot,
  nowMs: number,
  streamUsersForBuild: (onUser: (user: User) => void) => Promise<void>,
  factoryAggByUser: Map<string, UserFactoryAgg> = new Map(),
  equipmentByUser: Record<string, Equipment> = {},
): Promise<Snapshot> {
  // User-derived lookup maps start empty here and are filled by buildUserRows as
  // it streams users.ndjson; the MU/party/alliance builders read them afterward.
  const lookups = buildBaseLookups(raw.countries, raw.mus, raw.regions, raw.parties)
  const gearLookup = deriveGearLookup(raw.gameConfig)

  // Users stream in line by line so the 84 MB raw array never sits in memory.
  const userRows = await buildUserRows(
    streamUsersForBuild,
    lookups,
    nowMs,
    equipmentByUser,
    raw.gameConfig,
    gearLookup,
    factoryAggByUser,
  )

  const countryRows = buildCountryRows(raw.countries, raw.mus, userRows, lookups, raw.alliances)
  const governmentRows = buildGovernmentRows(raw.governments, lookups)
  const strategicBonuses = buildStrategicRows(raw.strategicBonuses)
  const muRows = buildMURows(raw.mus, userRows, lookups)
  const partyRows = buildPartyRows(raw.parties, userRows, lookups)
  const allianceRows = buildAllianceRows(raw.alliances, countryRows, userRows, lookups)
  const regionRows = buildRegionRows(raw.regions, lookups)
  const battleRows = buildBattleRows(raw.battles, raw.tournament, lookups)
  const userRanges = computeRanges(userRows)

  return {
    users: userRows,
    userRanges,
    countries: countryRows,
    governments: governmentRows,
    strategicBonuses,
    mus: muRows,
    parties: partyRows,
    alliances: allianceRows,
    regions: regionRows,
    battles: battleRows,
    lookups,
    tournament: raw.tournament,
    gameConfig: raw.gameConfig,
    gearLookup,
    equipmentJsonByUser: new Map(Object.entries(equipmentByUser).map(([id, gear]) => [id, JSON.stringify(gear)])),
    scrapedAt: raw.meta.scrapedAt ?? null,
  }
}

/**
 * Streams users.ndjson with refreshed users swapped in, then any refreshed
 * users the file doesn't have yet.
 */
function streamUsersWithOverlay(overlay: Map<string, User>): (onUser: (user: User) => void) => Promise<void> {
  return async (onUser) => {
    const consumed = new Set<string>()
    await streamUsers((u) => {
      const override = overlay.get(u._id)
      if (override) {
        consumed.add(u._id)
        onUser(override)
      } else {
        onUser(u)
      }
    })

    for (const [id, u] of overlay) {
      if (!consumed.has(id)) {
        onUser(u)
      }
    }
  }
}

/**
 * The one place a raw snapshot joins its NDJSON files, so every build path
 * (scrape, refresh, boot, lazy load) stays consistent.
 */
export async function buildSnapshotFromRaw(
  raw: RawSnapshot,
  label: string,
  userOverlay: Map<string, User> = new Map(),
): Promise<Snapshot> {
  const [factoryAggByUser, equipmentByUser] = await Promise.all([
    loadFactoryAggregates(raw),
    loadEquipmentByUser(),
  ])

  const start = Date.now()
  const snapshot = await buildSnapshot(
    raw,
    start,
    streamUsersWithOverlay(userOverlay),
    factoryAggByUser,
    equipmentByUser,
  )

  log.info({ label, durationMs: Date.now() - start, users: snapshot.users.length }, 'built rows')

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

  log.info('boot: loading persisted snapshot from disk')
  const raw = (await readRawSnapshot()) ?? emptyRawSnapshot()
  s.current = await buildSnapshotFromRaw(raw, 'boot')
  if (!s.current.users.length) {
    log.info('boot: no persisted data, starting empty until the scraper completes its first cycle')
  }

  log.info({ users: s.current.users.length }, 'boot: ready')
}

/**
 * The read API for every page and route, loading from disk on first use.
 *
 * Pages call `await connection()` first, so this never runs during prerender.
 */
export function getSnapshot(): Promise<Snapshot> {
  const s = store()
  if (s.current) {
    return Promise.resolve(s.current)
  }

  if (!s.loading) {
    s.loading = readRawSnapshot()
      .then(raw => raw ?? emptyRawSnapshot())
      .then(raw => buildSnapshotFromRaw(raw, 'lazy-load'))
      .then((snapshot) => {
        s.current ??= snapshot
        s.loading = null

        return s.current
      })
  }

  return s.loading
}
