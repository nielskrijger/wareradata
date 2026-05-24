import type { userLite } from '@/lib/warera/schemas'

import { z } from 'zod'
import { countriesList, musList, partiesList, region, snapshotMeta, usersList } from '@/lib/warera/schemas'

import { redis } from './redis'

const KEY_PREFIX = 'wareradata:snapshot'

// --- Single-key snapshots (small payloads) -------------------------------

const schemas = {
  countries: countriesList,
  mus: musList,
  parties: partiesList,
  regions: z.array(region),
  meta: snapshotMeta,
} as const

export type SnapshotEntity = keyof typeof schemas
export type SnapshotData<E extends SnapshotEntity> = z.infer<(typeof schemas)[E]>

function singleKey(entity: SnapshotEntity) {
  return `${KEY_PREFIX}:${entity}`
}

/**
 * Returns the stored snapshot for `entity`, or an empty value on cache miss
 * (empty array for lists, empty object for `meta`). Pages should render an
 * empty state when the result is empty rather than throwing.
 */
export async function readSnapshot<E extends SnapshotEntity>(entity: E): Promise<SnapshotData<E>> {
  const raw = await redis.get(singleKey(entity))
  if (raw === null || raw === undefined) {
    return (entity === 'meta' ? {} : []) as SnapshotData<E>
  }
  return schemas[entity].parse(raw) as SnapshotData<E>
}

export async function writeSnapshot<E extends SnapshotEntity>(
  entity: E,
  data: SnapshotData<E>,
): Promise<void> {
  await redis.set(singleKey(entity), schemas[entity].parse(data))
}

// --- Sharded users snapshot ----------------------------------------------
// Users total ~16k and ~64 MB serialized — exceeds Upstash's 10 MB SET cap.
// Shard by countryId: one key per country, plus an index key listing the
// country IDs that have data. See project memory `upstash-limits`.

const USERS_INDEX_KEY = `${KEY_PREFIX}:users:index`
const USERS_SHARD_PREFIX = `${KEY_PREFIX}:users:shard:`
const usersIndexSchema = z.array(z.string())

function usersShardKey(countryId: string) {
  return `${USERS_SHARD_PREFIX}${countryId}`
}

/**
 * Writes user shards keyed by country ID, plus the country-id index used by
 * `readAllUsers`. Shards are written in small batches to limit concurrent
 * Upstash requests. Logs per-shard byte size + a sorted summary so we can
 * spot fat shards that risk blowing the 10 MB MGET cap on the read side.
 */
export async function writeUsersSharded(byCountry: Record<string, z.infer<typeof userLite>[]>): Promise<void> {
  const countryIds = Object.keys(byCountry)

  const shardSizes: Array<{ countryId: string, users: number, bytes: number }> = []

  const SHARD_BATCH = 10
  for (let i = 0; i < countryIds.length; i += SHARD_BATCH) {
    const slice = countryIds.slice(i, i + SHARD_BATCH)
    await Promise.all(
      slice.map((cid) => {
        const parsed = usersList.parse(byCountry[cid])
        const bytes = Buffer.byteLength(JSON.stringify(parsed), 'utf8')
        shardSizes.push({ countryId: cid, users: parsed.length, bytes })
        return redis.set(usersShardKey(cid), parsed)
      }),
    )
  }
  await redis.set(USERS_INDEX_KEY, countryIds)

  shardSizes.sort((a, b) => b.bytes - a.bytes)
  const totalBytes = shardSizes.reduce((sum, s) => sum + s.bytes, 0)
  console.warn(
    `[scrape] wrote ${shardSizes.length} user shards, total ${fmtMB(totalBytes)} MB`,
  )
  for (const s of shardSizes.slice(0, 5)) {
    console.warn(`[scrape]   top shard ${s.countryId}: ${s.users} users, ${fmtMB(s.bytes)} MB`)
  }
}

function fmtMB(bytes: number): string {
  return (bytes / 1024 / 1024).toFixed(2)
}

// Upstash caps both request and response payloads at 10 MB. A full MGET of
// all shards can easily exceed that (some single-country shards are ~5 MB),
// so we fetch in chunks.
const READ_SHARD_CHUNK = 5

/**
 * Reads every user shard and returns the flat list, in no particular order.
 * Returns `[]` on cache miss so callers can render an empty state.
 *
 * Logs per-batch response sizes so we can see how close each MGET is to the
 * 10 MB cap. On failure, the error already names the actual byte size; the
 * surrounding batch log tells us which country IDs were involved.
 */
export async function readAllUsers(): Promise<z.infer<typeof userLite>[]> {
  const raw = await redis.get(USERS_INDEX_KEY)
  if (raw === null || raw === undefined) {
    return []
  }
  const countryIds = usersIndexSchema.parse(raw)
  if (!countryIds.length) {
    return []
  }

  const out: z.infer<typeof userLite>[] = []
  let batchNum = 0
  const totalBatches = Math.ceil(countryIds.length / READ_SHARD_CHUNK)
  for (let i = 0; i < countryIds.length; i += READ_SHARD_CHUNK) {
    batchNum++
    const slice = countryIds.slice(i, i + READ_SHARD_CHUNK)
    const keys = slice.map(cid => usersShardKey(cid)) as [string, ...string[]]
    try {
      const shards = (await redis.mget<(z.infer<typeof userLite>[] | null)[]>(...keys)) ?? []
      let batchBytes = 0
      let batchUsers = 0
      for (const shard of shards) {
        if (shard) {
          batchBytes += Buffer.byteLength(JSON.stringify(shard), 'utf8')
          const parsed = usersList.parse(shard)
          batchUsers += parsed.length
          out.push(...parsed)
        }
      }
      console.warn(
        `[users:read] batch ${batchNum}/${totalBatches}: ${slice.length} shards, ${batchUsers} users, ${(batchBytes / 1024 / 1024).toFixed(2)} MB`,
      )
    }
    catch (err) {
      console.error(
        `[users:read] batch ${batchNum}/${totalBatches} FAILED for countries [${slice.join(', ')}]:`,
        err instanceof Error ? err.message : err,
      )
      throw err
    }
  }
  return out
}
