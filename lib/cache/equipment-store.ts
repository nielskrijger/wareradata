import type { Equipment } from '@/lib/warera/api'

import { appendFile } from 'node:fs/promises'
import path from 'node:path'

import { dataDir } from './file-store'
import { streamNdjson, writeNdjson } from './ndjson'

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
 * per line (~14 MB), kept apart from `snapshot.json`. Each snapshot build streams
 * it once for gear scoring and keeps each loadout as JSON text on the Snapshot
 * for single-user lookups. Last line wins per user id, so an on-demand refresh
 * can append a fresher line without rewriting the whole file; the next main
 * scrape rewrites it clean.
 */
export function equipmentNdjsonPath(): string {
  return path.join(dataDir(), 'equipment.ndjson')
}

/**
 * Streams the equipment file line by line, invoking `onUser` per record.
 */
export function streamEquipmentUsers(onUser: (line: EquipmentUserLine) => void): Promise<void> {
  return streamNdjson(equipmentNdjsonPath(), onUser)
}

/**
 * Streams the equipment file into a per-user lookup for the snapshot build. Last
 * line wins per user id (an on-demand refresh appends a fresher line). Feeds
 * gear scoring in `buildUserRows` and the Snapshot's per-user equipment JSON.
 * Empty when the file doesn't exist yet.
 */
export async function loadEquipmentByUser(): Promise<Record<string, Equipment>> {
  const out: Record<string, Equipment> = {}
  await streamEquipmentUsers(({ userId, equipment }) => {
    out[userId] = equipment
  })
  return out
}

/**
 * The stored gear of the given users (last line wins).
 */
export async function loadEquipmentByIds(ids: ReadonlySet<string>): Promise<Map<string, Equipment>> {
  const out = new Map<string, Equipment>()
  if (ids.size) {
    await streamEquipmentUsers(({ userId, equipment }) => {
      if (ids.has(userId)) {
        out.set(userId, equipment)
      }
    })
  }
  return out
}

/**
 * Atomically (re)writes the equipment file from the freshly scraped lists
 * (parallel arrays: `equipmentList[i]` is `userIds[i]`'s gear). A line is written
 * for every user (including `{}`), preserving the captured-but-empty vs
 * not-captured split.
 */
export function writeEquipmentNdjson(userIds: string[], equipmentList: Equipment[]): Promise<void> {
  return writeNdjson(equipmentNdjsonPath(), equipmentLines(userIds, equipmentList))
}

function* equipmentLines(userIds: string[], equipmentList: Equipment[]): Generator<EquipmentUserLine> {
  for (let i = 0; i < userIds.length; i++) {
    yield { userId: userIds[i], equipment: equipmentList[i] }
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
