import type { Battle } from '@/lib/warera/api'

import { Buffer } from 'node:buffer'

import { redis } from './redis'

const KEY_PREFIX = 'wareradata:archive:battles'
const SEEN_KEY = `${KEY_PREFIX}:seen`
const INDEX_KEY = `${KEY_PREFIX}:index`

function dayKey(day: string) {
  return `${KEY_PREFIX}:${day}`
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
 * Strips the heavy per-hit `lastHits` arrays from a finished battle before it's
 * archived. For a finished fight those are just the final round's last ~10 hits
 * (a live-combat detail), ~12 KB of the ~13 KB record, and carry no historical
 * value. We keep winner, damages, rounds, region, money pool, and timestamps.
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
 * Captures finished battles into the per-day history archive.
 *
 * Append-only and idempotent: a Redis Set of seen `_id`s means re-runs (and the
 * overlapping rolling window the API returns each day) never double-store. New
 * battles are trimmed (see {@link trimForArchive}), grouped by the UTC day they
 * ended, and merged into `…:battles:YYYY-MM-DD`. The day is recorded in an
 * index set so a future history view can list what's available.
 */
export async function recordBattleHistory(battles: Battle[]): Promise<ArchiveResult> {
  const finished = battles.filter(b => !b.isActive)

  const seenList = (await redis.smembers(SEEN_KEY)) as string[]
  const seen = new Set(seenList)

  const fresh = finished.filter(b => !seen.has(b._id))
  if (!fresh.length) {
    return { fetched: finished.length, newlyArchived: 0, alreadySeen: finished.length, daysTouched: [] }
  }

  // Group fresh battles by their end-day so each day's key is a single merge.
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

  for (const [day, dayBattles] of byDay) {
    const existing = ((await redis.get(dayKey(day))) as Battle[] | null) ?? []
    const merged = [...existing, ...dayBattles]
    const bytes = Buffer.byteLength(JSON.stringify(merged), 'utf8')
    await redis.set(dayKey(day), merged)
    await redis.sadd(INDEX_KEY, day)
    console.warn(`[archive] ${day}: +${dayBattles.length} battles (${merged.length} total, ${(bytes / 1024).toFixed(0)} KB)`)
  }

  // Mark all fresh ids as seen in one call (sadd takes a spread of members).
  const freshIds = fresh.map(b => b._id) as [string, ...string[]]
  await redis.sadd(SEEN_KEY, ...freshIds)

  return {
    fetched: finished.length,
    newlyArchived: fresh.length,
    alreadySeen: finished.length - fresh.length,
    daysTouched: [...byDay.keys()].sort(),
  }
}
