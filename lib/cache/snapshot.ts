import type { userLite } from '@/lib/warera/schemas'

import { z } from 'zod'
import { countriesList, musList, region, snapshotMeta, usersList } from '@/lib/warera/schemas'

import { redis } from './redis'

const KEY_PREFIX = 'wareradata:snapshot'

// --- Single-key snapshots (small payloads) -------------------------------

const schemas = {
  countries: countriesList,
  mus: musList,
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
 * Upstash requests.
 */
export async function writeUsersSharded(byCountry: Record<string, z.infer<typeof userLite>[]>): Promise<void> {
  const countryIds = Object.keys(byCountry)
  // Write shards in small batches to keep concurrent Upstash requests modest.
  const SHARD_BATCH = 10
  for (let i = 0; i < countryIds.length; i += SHARD_BATCH) {
    const slice = countryIds.slice(i, i + SHARD_BATCH)
    await Promise.all(
      slice.map(cid => redis.set(usersShardKey(cid), usersList.parse(byCountry[cid]))),
    )
  }
  await redis.set(USERS_INDEX_KEY, countryIds)
}

// Upstash caps both request and response payloads at 10 MB. A full MGET of
// all shards can easily exceed that (some single-country shards are ~5 MB),
// so we fetch in chunks.
const READ_SHARD_CHUNK = 10

/**
 * Reads every user shard and returns the flat list, in no particular order.
 * Returns `[]` on cache miss so callers can render an empty state.
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
  for (let i = 0; i < countryIds.length; i += READ_SHARD_CHUNK) {
    const slice = countryIds.slice(i, i + READ_SHARD_CHUNK)
    const keys = slice.map(cid => usersShardKey(cid)) as [string, ...string[]]
    const shards = (await redis.mget<(z.infer<typeof userLite>[] | null)[]>(...keys)) ?? []
    for (const shard of shards) {
      if (shard) {
        const parsed = usersList.parse(shard)
        out.push(...parsed)
      }
    }
  }
  return out
}
