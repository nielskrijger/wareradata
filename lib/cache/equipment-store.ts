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
 * One {@link EquipmentUserLine} per line, apart from `snapshot.json`.
 *
 * The last line per user wins, so a refresh can append instead of rewriting;
 * each main scrape rewrites the file clean.
 */
function equipmentNdjsonPath(): string {
  return path.join(dataDir(), 'equipment.ndjson')
}

/**
 * Streams the equipment file line by line, invoking `onUser` per record.
 */
function streamEquipmentUsers(onUser: (line: EquipmentUserLine) => void): Promise<void> {
  return streamNdjson(equipmentNdjsonPath(), onUser)
}

/**
 * Each user's gear for the snapshot build; empty when there's no file yet.
 */
export async function loadEquipmentByUser(): Promise<Record<string, Equipment>> {
  const out: Record<string, Equipment> = {}
  await streamEquipmentUsers(({ userId, equipment }) => {
    out[userId] = equipment
  })

  return out
}

/**
 * Lets a scrape keep a user's previous gear when their fetch fails.
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
 * Writes a line for every user, `{}` included, so "captured, nothing equipped"
 * stays distinct from "not captured".
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
 * Appends refreshed users' gear; the next main scrape rewrites the file, so
 * the duplicates never pile up.
 */
export async function appendEquipmentLines(userIds: string[], equipmentList: Equipment[]): Promise<void> {
  let buf = ''
  for (let i = 0; i < userIds.length; i++) {
    buf += `${JSON.stringify({ userId: userIds[i], equipment: equipmentList[i] })}\n`
  }

  await appendFile(equipmentNdjsonPath(), buf, 'utf8')
}
