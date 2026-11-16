import type { Battle } from '@/lib/warera/api'

import path from 'node:path'

import { logger } from '@/lib/log'

import { archiveDir, readJsonFile, writeJsonFile } from './file-store'

const log = logger.child({ component: 'archive' })

function dayFile(day: string): string {
  return path.join(archiveDir(), `battles-${day}.json`)
}

function seenFile(): string {
  return path.join(archiveDir(), 'seen.json')
}

function indexFile(): string {
  return path.join(archiveDir(), 'index.json')
}

/**
 * The calendar day (UTC) a battle belongs to in the archive, derived from when
 * it ended. Finished battles always carry `endedAt`; we fall back to
 * `createdAt` then today only to avoid dropping an oddly-shaped record.
 */
function battleDay(b: Battle): string {
  const iso = b.endedAt ?? b.createdAt ?? new Date().toISOString()

  return iso.slice(0, 10)
}

/**
 * Drops `lastHits` before archiving: for a finished battle it's only the last
 * round's final hits, yet ~12 of the record's ~13 KB.
 */
function trimForArchive(b: Battle): Battle {
  if (!b.currentRound) {
    return b
  }

  return {
    ...b,
    currentRound: {
      ...b.currentRound,
      attacker: { ...b.currentRound.attacker, lastHits: [] },
      defender: { ...b.currentRound.defender, lastHits: [] },
    },
  }
}

export interface ArchiveResult {
  fetched: number
  newlyArchived: number
  alreadySeen: number
  daysTouched: string[]
}

/**
 * Appends newly finished battles to per-day files under `archive/`.
 *
 * The API serves only a rolling ~2-week window of finished battles, so this
 * is the only way to keep a full history. `seen.json` makes it idempotent
 * across the overlapping windows.
 */
export async function recordBattleHistory(battles: Battle[]): Promise<ArchiveResult> {
  const finished = battles.filter(b => !b.isActive)

  const seenList = await readJsonFile<string[]>(seenFile(), [])
  const seen = new Set(seenList)

  const fresh = finished.filter(b => !seen.has(b._id))
  if (!fresh.length) {
    return { fetched: finished.length, newlyArchived: 0, alreadySeen: finished.length, daysTouched: [] }
  }

  // Group fresh battles by their end-day so each day's file is a single merge.
  const byDay = new Map<string, Battle[]>()
  for (const b of fresh) {
    const day = battleDay(b)
    const bucket = byDay.get(day)
    if (bucket) {
      bucket.push(trimForArchive(b))
    } else {
      byDay.set(day, [trimForArchive(b)])
    }
  }

  const index = new Set(await readJsonFile<string[]>(indexFile(), []))
  for (const [day, dayBattles] of byDay) {
    const existing = await readJsonFile<Battle[]>(dayFile(day), [])
    const merged = [...existing, ...dayBattles]
    await writeJsonFile(dayFile(day), merged)
    index.add(day)
    log.info({ day, added: dayBattles.length, total: merged.length }, 'recorded day')
  }

  await writeJsonFile(indexFile(), [...index].sort())

  // Persist the seen set so the next cycle dedupes against it.
  for (const b of fresh) {
    seen.add(b._id)
  }

  await writeJsonFile(seenFile(), [...seen])

  return {
    fetched: finished.length,
    newlyArchived: fresh.length,
    alreadySeen: finished.length - fresh.length,
    daysTouched: [...byDay.keys()].sort(),
  }
}
