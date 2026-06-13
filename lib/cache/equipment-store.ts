import type { Equipment } from '@/lib/warera/api'

import { once } from 'node:events'
import { createReadStream, createWriteStream } from 'node:fs'
import { appendFile, mkdir, rename, unlink } from 'node:fs/promises'
import path from 'node:path'
import { createInterface } from 'node:readline'

import { dataDir } from './file-store'

/**
 * One NDJSON line of the equipment file: a user id plus their currently-equipped
 * gear. A user wearing nothing is stored as `{}` (captured, none equipped),
 * distinct from a user with no line at all (gear not captured).
 */
export interface EquipmentUserLine {
  userId: string
  equipment: Equipment
}

/**
 * The equipment file: newline-delimited JSON, one {@link EquipmentUserLine}
 * per line. Split out of `snapshot.json` (~14 MB) so the persisted RawSnapshot
 * no longer carries a full equipment Record. The build streams it into a
 * transient per-user lookup for gear scoring (never retained on the Snapshot),
 * and the user detail page reads a single user's line. Last line wins per user
 * id, so an on-demand refresh can append a fresher line without rewriting the
 * whole file; the next main scrape rewrites it clean.
 */
export function equipmentNdjsonPath(): string {
  return path.join(dataDir(), 'equipment.ndjson')
}

/**
 * Streams the equipment file line by line, invoking `onUser` per record.
 * Resolves silently when the file doesn't exist yet (no scrape has run). Skips
 * blank or unparseable lines (e.g. a torn final line from a crashed writer).
 */
export async function streamEquipmentUsers(onUser: (line: EquipmentUserLine) => void): Promise<void> {
  const rl = createInterface({
    input: createReadStream(equipmentNdjsonPath(), { encoding: 'utf8' }),
    crlfDelay: Infinity,
  })

  try {
    for await (const line of rl) {
      if (!line.trim()) {
        continue
      }
      try {
        onUser(JSON.parse(line) as EquipmentUserLine)
      } catch {
        // Skip a torn/partial line rather than failing the whole build.
      }
    }
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw err
    }
  }
}

/**
 * Streams the equipment file into a per-user lookup for the snapshot build. Last
 * line wins per user id (an on-demand refresh appends a fresher line). The map
 * is consumed transiently by `buildUserRows` for gear scoring and then released
 * — it is NOT stored on the Snapshot. Empty when the file doesn't exist yet.
 */
export async function loadEquipmentByUser(): Promise<Record<string, Equipment>> {
  const out: Record<string, Equipment> = {}
  await streamEquipmentUsers(({ userId, equipment }) => {
    out[userId] = equipment
  })
  return out
}

/**
 * Reads one user's equipment from the file, or null when absent. Backs the user
 * detail page and the hover-card API. Scans the whole file keeping the last
 * match, since an on-demand refresh appends a fresher line for that user — but
 * the user id is a unique token, so the cheap `includes` pre-filter skips the
 * JSON.parse for the ~17k lines that can't match. Returns null when the file
 * doesn't exist yet.
 */
export async function loadUserEquipment(userId: string): Promise<Equipment | null> {
  const rl = createInterface({
    input: createReadStream(equipmentNdjsonPath(), { encoding: 'utf8' }),
    crlfDelay: Infinity,
  })

  let found: Equipment | null = null
  try {
    for await (const line of rl) {
      if (!line.includes(userId)) {
        continue
      }
      try {
        const parsed = JSON.parse(line) as EquipmentUserLine
        if (parsed.userId === userId) {
          found = parsed.equipment
        }
      } catch {
        // Skip a torn/partial line rather than failing the lookup.
      }
    }
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw err
    }
  }
  return found
}

/**
 * Atomically (re)writes the equipment file from the freshly scraped lists
 * (parallel arrays: `equipmentList[i]` is `userIds[i]`'s gear). Streams one
 * NDJSON line per user to a temp file, then renames over `equipment.ndjson` — so
 * a crashed/partial write leaves the previous file intact and the whole
 * serialized blob is never held in memory. A line is written for every user
 * (including `{}`), preserving the captured-but-empty vs not-captured split.
 */
export async function writeEquipmentNdjson(userIds: string[], equipmentList: Equipment[]): Promise<void> {
  const finalPath = equipmentNdjsonPath()
  // The main scrape writes this before snapshot.json, so on a cold volume the
  // data dir may not exist yet.
  await mkdir(dataDir(), { recursive: true })

  const tmpPath = `${finalPath}.tmp.${process.pid}.${Date.now()}`
  const out = createWriteStream(tmpPath, { encoding: 'utf8' })

  try {
    for (let i = 0; i < userIds.length; i++) {
      const line = `${JSON.stringify({ userId: userIds[i], equipment: equipmentList[i] })}\n`
      if (!out.write(line)) {
        await once(out, 'drain')
      }
    }
    out.end()
    await once(out, 'finish')
    await rename(tmpPath, finalPath)
  } catch (err) {
    out.destroy()
    await unlink(tmpPath).catch(() => undefined)
    throw err
  }
}

/**
 * Appends fresh equipment lines for on-demand-refreshed users. The reader takes
 * the last line per user, so these override the scrape's lines until the next
 * main cycle rewrites the file. Cheap (one line per user), and the file
 * self-cleans each cycle, so the duplicates never accumulate past one pass.
 */
export async function appendEquipmentLines(userIds: string[], equipmentList: Equipment[]): Promise<void> {
  let buf = ''
  for (let i = 0; i < userIds.length; i++) {
    buf += `${JSON.stringify({ userId: userIds[i], equipment: equipmentList[i] })}\n`
  }
  await appendFile(equipmentNdjsonPath(), buf, 'utf8')
}
