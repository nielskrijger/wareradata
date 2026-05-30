import type { Battle, Country, Equipment, MU, Party, Region, SnapshotMeta, TournamentSnapshot, UserLite } from '@/lib/warera/api'

import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import path from 'node:path'

/**
 * The whole scraped dataset in its raw API shape (the inputs to the row
 * builders, not the built rows). Persisted as a single JSON file so the
 * scraper publishes a globally consistent snapshot with one atomic rename.
 */
export interface RawSnapshot {
  users: UserLite[]
  // Currently-equipped gear keyed by user id. A user may be absent (no equipment
  // captured) or present with `{}` (stripped between battles); both render the
  // same in the UI.
  equipment: Record<string, Equipment>
  countries: Country[]
  mus: MU[]
  regions: Region[]
  parties: Party[]
  battles: Battle[]
  tournament: TournamentSnapshot
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
    equipment: {},
    countries: [],
    mus: [],
    regions: [],
    parties: [],
    battles: [],
    tournament: { id: null, name: null, teams: {} },
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
      console.info(`[file-store] no snapshot at ${path} yet (cold volume)`)
      return null
    }
    throw err
  }
  const readMs = Date.now() - start
  const parsed = JSON.parse(raw) as RawSnapshot
  // Backfill fields added to RawSnapshot after the persisted file was written,
  // so a deploy that adds a new key doesn't crash on the first boot reading a
  // legacy on-disk snapshot. The next scrape cycle will populate them properly.
  parsed.equipment ??= {}
  const sizeMb = (raw.length / 1_000_000).toFixed(1)
  console.info(
    `[file-store] read snapshot from ${path}: ${sizeMb}MB, ${parsed.users?.length ?? 0} users in ${readMs}ms`,
  )
  return parsed
}

/**
 * Persists the snapshot atomically: write to a unique temp file in the same
 * directory, then rename over the live file. A same-filesystem rename is atomic
 * on POSIX, so a concurrent reader sees either the old or the new file, never a
 * half-written one. The temp name is unique per write to avoid clobbering, even
 * though the single scrape worker already serializes writes.
 */
export async function writeRawSnapshot(snapshot: RawSnapshot): Promise<void> {
  const dir = dataDir()
  await mkdir(dir, { recursive: true })

  const tmp = path.join(dir, `snapshot.json.tmp.${process.pid}.${Date.now()}`)
  await writeFile(tmp, JSON.stringify(snapshot))
  await rename(tmp, snapshotPath())
}
