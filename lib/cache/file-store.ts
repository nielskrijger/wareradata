import type { Alliance, Battle, Country, GameConfig, Government, ItemBestRegion, MarketPrices, MU, Party, Region, SnapshotMeta, TournamentSnapshot, User } from '@/lib/warera/api'

import { createWriteStream } from 'node:fs'
import { mkdir, readdir, readFile, rename, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { pipeline } from 'node:stream/promises'

import { logger } from '@/lib/log'

const log = logger.child({ phase: 'file-store' })

/**
 * The whole scraped dataset in its raw API shape (the inputs to the row
 * builders, not the built rows). Persisted as a single JSON file so the
 * scraper publishes a globally consistent snapshot with one atomic rename.
 */
export interface RawSnapshot {
  users: User[]
  // Currently-equipped gear lives in a separate equipment.ndjson file, not here,
  // so the persisted snapshot stays ~14 MB lighter (see lib/cache/equipment-store).
  countries: Country[]
  // Each occupied country's elected officials (president, ministers, congress),
  // keyed by country id, all as user ids. Captured once per scrape via the
  // per-country government endpoint. Dormant countries with no government are
  // simply absent from the map.
  governments: Record<string, Government>
  mus: MU[]
  regions: Region[]
  parties: Party[]
  // Multi-country blocs, captured whole (currently ~10). Members and rankings
  // ride along on each alliance, so no per-alliance fan-out is needed.
  alliances: Alliance[]
  battles: Battle[]
  tournament: TournamentSnapshot
  // The game's static config (item stats, skill cost curves, …), captured every
  // scrape. The gear-score roll bounds and skill cost curve are derived from it.
  gameConfig: GameConfig
  // Market context for the factory profit model, captured each cycle (~2 extra
  // requests): current item prices, and the best-region bonus per item (the
  // "production frontier"). Kept here so the row builders can value factories at
  // build time without any network. Empty on a legacy/cold snapshot.
  prices: MarketPrices
  itemBestRegions: Record<string, ItemBestRegion>
  meta: SnapshotMeta
}

export function dataDir(): string {
  return path.resolve(process.env.DATA_DIR ?? './.data')
}

export function snapshotPath(): string {
  return path.join(dataDir(), 'snapshot.json')
}

export function archiveDir(): string {
  return path.join(dataDir(), 'archive')
}

// Temp-file prefix for the atomic snapshot write. A write that crashes before
// its rename can leave one behind; the next successful write sweeps stale ones.
const SNAPSHOT_TMP_PREFIX = 'snapshot.json.tmp.'

/**
 * Reads and JSON-parses a file, or returns `fallback` when it doesn't exist
 * yet. Used by the battle archive for its per-day, seen, and index files.
 */
export async function readJsonFile<T>(filePath: string, fallback: T): Promise<T> {
  let raw: string
  try {
    raw = await readFile(filePath, 'utf8')
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      return fallback
    }
    throw err
  }
  return JSON.parse(raw) as T
}

/**
 * Atomically writes JSON to `filePath` (temp file + rename), creating the
 * parent directory if needed. Same torn-write guarantee as the main snapshot.
 */
export async function writeJsonFile(filePath: string, data: unknown): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true })

  const tmp = `${filePath}.tmp.${process.pid}.${Date.now()}`
  await writeFile(tmp, JSON.stringify(data))
  await rename(tmp, filePath)
}

export function emptyRawSnapshot(): RawSnapshot {
  return {
    users: [],
    countries: [],
    governments: {},
    mus: [],
    regions: [],
    parties: [],
    alliances: [],
    battles: [],
    tournament: { id: null, name: null, teams: {} },
    // Empty bootstrap placeholder (cold volume, before the first scrape). It has
    // no users, so the derivations that read it are never exercised; the first
    // scrape replaces this with the real config.
    gameConfig: {} as GameConfig,
    prices: {} as MarketPrices,
    itemBestRegions: {},
    meta: {},
  }
}

/**
 * Reads the persisted snapshot, or null when the file doesn't exist yet (a cold
 * volume). Callers substitute {@link emptyRawSnapshot} so pages render the empty
 * state. Any other error rethrows: a corrupt or unreadable file should surface,
 * not silently degrade to empty.
 */
export async function readRawSnapshot(): Promise<RawSnapshot | null> {
  const path = snapshotPath()
  const start = Date.now()
  let raw: string
  try {
    raw = await readFile(path, 'utf8')
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      log.info({ path }, 'no snapshot yet (cold volume)')
      return null
    }
    throw err
  }
  const readMs = Date.now() - start
  const parsed = JSON.parse(raw) as RawSnapshot
  // Backfill fields added to RawSnapshot after the persisted file was written,
  // so a deploy that adds a new key doesn't crash on the first boot reading a
  // legacy on-disk snapshot. The next scrape cycle will populate them properly.
  parsed.governments ??= {}
  parsed.alliances ??= []
  parsed.prices ??= {} as RawSnapshot['prices']
  parsed.itemBestRegions ??= {}

  // Legacy snapshots embedded equipment (now in equipment.ndjson). Drop the dead
  // key so a pre-migration file doesn't pin ~17 MB of unused gear until the next
  // scrape rewrites the snapshot without it.
  delete (parsed as { equipment?: unknown }).equipment

  log.info({ path, sizeMb: Number((raw.length / 1_000_000).toFixed(1)), users: parsed.users?.length ?? 0, readMs }, 'read snapshot')
  return parsed
}

/**
 * Streams the snapshot as JSON one piece at a time, so we never materialize the
 * whole serialized string (and its write buffer) in memory at once. The one big
 * collection (users) is emitted item by item; everything else is small enough to
 * stringify whole. Key order is irrelevant to a parser, and `JSON.stringify` of
 * an `undefined` value yields `undefined`, which we skip to mirror how
 * `JSON.stringify` drops undefined-valued properties.
 */
function* serializeSnapshot(snapshot: RawSnapshot): Generator<string> {
  yield '{"users":['
  let sep = ''
  for (const user of snapshot.users) {
    const json = JSON.stringify(user)
    if (json === undefined) {
      continue
    }
    yield sep + json
    sep = ','
  }
  yield ']'

  yield `,"countries":${JSON.stringify(snapshot.countries)}`
  yield `,"governments":${JSON.stringify(snapshot.governments)}`
  yield `,"mus":${JSON.stringify(snapshot.mus)}`
  yield `,"regions":${JSON.stringify(snapshot.regions)}`
  yield `,"parties":${JSON.stringify(snapshot.parties)}`
  yield `,"alliances":${JSON.stringify(snapshot.alliances)}`
  yield `,"battles":${JSON.stringify(snapshot.battles)}`
  yield `,"tournament":${JSON.stringify(snapshot.tournament)}`
  yield `,"gameConfig":${JSON.stringify(snapshot.gameConfig)}`
  yield `,"prices":${JSON.stringify(snapshot.prices)}`
  yield `,"itemBestRegions":${JSON.stringify(snapshot.itemBestRegions)}`
  yield `,"meta":${JSON.stringify(snapshot.meta)}`
  yield '}'
}

/**
 * Removes leftover snapshot temp files (orphans from a write that crashed before
 * its rename). The current write's temp file is already renamed away by the time
 * this runs, and the single scrape worker serializes writes, so everything still
 * matching the prefix is stale. Best-effort: never throws.
 */
async function cleanupStaleTempFiles(dir: string): Promise<void> {
  const entries = await readdir(dir)
  await Promise.all(
    entries
      .filter(name => name.startsWith(SNAPSHOT_TMP_PREFIX))
      .map(name => unlink(path.join(dir, name)).catch(() => undefined)),
  )
}

/**
 * Persists the snapshot atomically: stream it to a unique temp file in the same
 * directory, then rename over the live file. A same-filesystem rename is atomic
 * on POSIX, so a concurrent reader sees either the old or the fully-written new
 * file, never a half-written one. Streaming keeps peak memory flat instead of
 * holding the whole serialized blob plus its write buffer (which was OOM-ing the
 * scraper). On failure the partial temp file is removed; on success any stale
 * temp files from earlier crashed writes are swept.
 */
export async function writeRawSnapshot(snapshot: RawSnapshot): Promise<void> {
  const dir = dataDir()
  await mkdir(dir, { recursive: true })

  const tmp = path.join(dir, `${SNAPSHOT_TMP_PREFIX}${process.pid}.${Date.now()}`)
  try {
    await pipeline(serializeSnapshot(snapshot), createWriteStream(tmp))
    await rename(tmp, snapshotPath())
  } catch (err) {
    await unlink(tmp).catch(() => undefined)
    throw err
  }

  await cleanupStaleTempFiles(dir).catch(() => undefined)
}
