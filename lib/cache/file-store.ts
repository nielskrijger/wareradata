import type {
  Alliance,
  Battle,
  Country,
  GameConfig,
  Government,
  MarketPrices,
  MU,
  Party,
  Region,
  SnapshotMeta,
  StrategicBonuses,
  TournamentSnapshot,
} from '@/lib/warera/api'

import { createWriteStream } from 'node:fs'
import { mkdir, readdir, readFile, rename, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { pipeline } from 'node:stream/promises'

import { logger } from '@/lib/log'

const log = logger.child({ component: 'file-store' })

/**
 * The whole scraped dataset in its raw API shape (the inputs to the row
 * builders, not the built rows). Persisted as a single JSON file so the
 * scraper publishes a globally consistent snapshot with one atomic rename.
 */
export interface RawSnapshot {
  /**
   * Users and equipment live in their own NDJSON files, which keeps this file
   * small (~5 MB).
   */
  countries: Country[]

  /**
   * Elected officials as user ids, by country id; countries with no
   * government are absent.
   */
  governments: Record<string, Government>

  /**
   * Strategic resource bonuses per country id (the alliance-wide bonus for
   * alliance members). Countries holding no resource are absent. Optional, so
   * a snapshot without it still loads.
   */
  strategicBonuses?: Record<string, StrategicBonuses>
  mus: MU[]
  regions: Region[]
  parties: Party[]

  /**
   * Multi-country blocs, captured whole (currently ~10). Members and rankings
   * ride along on each alliance, so no per-alliance fan-out is needed.
   */
  alliances: Alliance[]
  battles: Battle[]
  tournament: TournamentSnapshot

  /**
   * The game's static config (item stats, skill cost curves, …), captured every
   * scrape. The gear-score roll bounds and skill cost curve are derived from it.
   */
  gameConfig: GameConfig

  /**
   * Item prices, so the build can value factories without the network. Empty
   * on a cold volume.
   */
  prices: MarketPrices
  meta: SnapshotMeta
}

/**
 * `DATA_DIR`, else `.data`. The turbopackIgnore marks this as a runtime path so
 * the build doesn't trace the whole project.
 */
export function dataDir(): string {
  return path.resolve(/* turbopackIgnore: true */ process.cwd(), process.env.DATA_DIR ?? '.data')
}

function snapshotPath(): string {
  return path.join(dataDir(), 'snapshot.json')
}

export function archiveDir(): string {
  return path.join(dataDir(), 'archive')
}

/**
 * Matches every temp file our atomic writers create (`<file>.tmp.<pid>.<ms>`),
 * capturing the writer's pid. Shared by the snapshot, NDJSON, and archive writers.
 */
const TEMP_FILE_RE = /\.tmp\.(\d+)\.\d+$/

/**
 * Whether a process with this pid is still running. `kill(pid, 0)` sends no
 * signal, it only checks: ESRCH means gone, EPERM means alive but not ours.
 */
function isProcessAlive(pid: number): boolean {
  try {
    process.kill(pid, 0)

    return true
  } catch (err) {
    return (err as NodeJS.ErrnoException).code === 'EPERM'
  }
}

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
    meta: {},
  }
}

/**
 * Null on a cold volume; any other error rethrows, since a corrupt file should
 * surface rather than silently become empty.
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

  log.info({
    path,
    sizeMb: Number((raw.length / 1_000_000).toFixed(1)),
    countries: parsed.countries?.length ?? 0,
    readMs,
  }, 'read snapshot')

  return parsed
}

/**
 * Streams the snapshot one field at a time so the write never holds a second
 * serialized copy in memory.
 */
function* serializeSnapshot(snapshot: RawSnapshot): Generator<string> {
  let sep = '{'
  for (const [key, value] of Object.entries(snapshot)) {
    if (value !== undefined) {
      yield `${sep}${JSON.stringify(key)}:${JSON.stringify(value)}`
      sep = ','
    }
  }

  yield sep === '{' ? '{}' : '}'
}

/**
 * Removes temp files left by writes that died before their rename.
 *
 * Only files whose writer process is gone, so a long write in flight (the
 * factory scrape, a CLI beside the server) is never touched. Never throws.
 */
export async function sweepStaleTempFiles(): Promise<void> {
  for (const dir of [dataDir(), archiveDir()]) {
    let entries: string[]
    try {
      entries = await readdir(dir)
    } catch {
      continue
    }

    const stale = entries.filter((name) => {
      const match = TEMP_FILE_RE.exec(name)

      return match !== null && !isProcessAlive(Number(match[1]))
    })

    await Promise.all(stale.map(name => unlink(path.join(dir, name)).catch(() => undefined)))
    if (stale.length) {
      log.info({ dir, removed: stale.length }, 'swept stale temp files')
    }
  }
}

/**
 * Writes to a temp file and renames over the live one, so readers never see a
 * half-written file.
 */
export async function writeRawSnapshot(snapshot: RawSnapshot): Promise<void> {
  const dir = dataDir()
  await mkdir(dir, { recursive: true })

  const tmp = `${snapshotPath()}.tmp.${process.pid}.${Date.now()}`
  try {
    await pipeline(serializeSnapshot(snapshot), createWriteStream(tmp))
    await rename(tmp, snapshotPath())
  } catch (err) {
    await unlink(tmp).catch(() => undefined)
    throw err
  }

  await sweepStaleTempFiles()
}
