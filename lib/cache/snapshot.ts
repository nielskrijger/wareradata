import type { Country, MU, Party, Region, SnapshotMeta, UserLite } from '@/lib/warera/api'

import { Buffer } from 'node:buffer'

import { redis } from './redis'

const KEY_PREFIX = 'wareradata:snapshot'

interface SnapshotShape {
  countries: Country[]
  mus: MU[]
  parties: Party[]
  regions: Region[]
  meta: SnapshotMeta
}

export type SnapshotEntity = keyof SnapshotShape
export type SnapshotData<E extends SnapshotEntity> = SnapshotShape[E]

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
  return raw as SnapshotData<E>
}

export async function writeSnapshot<E extends SnapshotEntity>(
  entity: E,
  data: SnapshotData<E>,
): Promise<void> {
  await redis.set(singleKey(entity), data)
}

// --- Sharded users snapshot ----------------------------------------------
// Users total ~16k and ~64 MB serialized, which exceeds Upstash's 10 MB
// request cap. We shard into BUCKETS fixed buckets, hashing by the user's
// `_id` (last two hex chars mod BUCKETS) so the distribution is uniform
// regardless of country sizes. With 32 buckets and 62 MB total, each bucket
// is ~2 MB and an MGET of READ_SHARD_CHUNK buckets stays well under 10 MB.
//
// History: we used to shard by countryId, but Germany alone grew to ~7 MB
// and a single MGET batch that included it would push past the cap. See
// project memory `upstash-limits`.

const BUCKETS = 32
const READ_SHARD_CHUNK = 4
const USERS_BUCKET_PREFIX = `${KEY_PREFIX}:users:bucket:`

function usersBucketKey(bucket: number) {
  return `${USERS_BUCKET_PREFIX}${bucket}`
}

/**
 * Bucket assignment. Uses the last two hex chars of the Mongo ObjectId,
 * which are derived from the random portion of the ID — uniform across all
 * users regardless of country, MU, etc.
 */
function bucketFor(userId: string): number {
  return Number.parseInt(userId.slice(-2), 16) % BUCKETS
}

/**
 * Writes user buckets. The input is the flat list of users; we hash and
 * group internally. Logs per-bucket sizes so we can spot any drift toward
 * the 10 MB cap as the dataset grows.
 */
export async function writeUsersSharded(users: UserLite[]): Promise<void> {
  const buckets: UserLite[][] = Array.from({ length: BUCKETS }, () => [])
  for (const u of users) {
    buckets[bucketFor(u._id)].push(u)
  }

  const bucketSizes: Array<{ bucket: number, users: number, bytes: number }> = []

  const SHARD_BATCH = 8
  for (let i = 0; i < BUCKETS; i += SHARD_BATCH) {
    const slice = Array.from({ length: Math.min(SHARD_BATCH, BUCKETS - i) }, (_, k) => i + k)
    await Promise.all(
      slice.map((b) => {
        const data = buckets[b]
        const bytes = Buffer.byteLength(JSON.stringify(data), 'utf8')
        bucketSizes.push({ bucket: b, users: data.length, bytes })
        return redis.set(usersBucketKey(b), data)
      }),
    )
  }

  bucketSizes.sort((a, b) => b.bytes - a.bytes)
  const totalBytes = bucketSizes.reduce((sum, s) => sum + s.bytes, 0)
  const totalUsers = bucketSizes.reduce((sum, s) => sum + s.users, 0)
  console.warn(
    `[scrape] wrote ${BUCKETS} user buckets, ${totalUsers} users, total ${fmtMB(totalBytes)} MB`,
  )
  for (const s of bucketSizes.slice(0, 3)) {
    console.warn(`[scrape]   top bucket ${s.bucket}: ${s.users} users, ${fmtMB(s.bytes)} MB`)
  }
}

function fmtMB(bytes: number): string {
  return (bytes / 1024 / 1024).toFixed(2)
}

/**
 * Reads every user bucket and returns the flat list, in no particular
 * order. Returns `[]` on cache miss so callers can render an empty state.
 *
 * Logs per-batch response sizes so we can see how close each MGET is to
 * the 10 MB cap. On failure, logs the failing bucket numbers.
 */
export async function readAllUsers(): Promise<UserLite[]> {
  const out: UserLite[] = []
  const totalBatches = Math.ceil(BUCKETS / READ_SHARD_CHUNK)
  let batchNum = 0

  for (let i = 0; i < BUCKETS; i += READ_SHARD_CHUNK) {
    batchNum++
    const slice = Array.from({ length: Math.min(READ_SHARD_CHUNK, BUCKETS - i) }, (_, k) => i + k)
    const keys = slice.map(b => usersBucketKey(b)) as [string, ...string[]]

    try {
      const shards = (await redis.mget<(UserLite[] | null)[]>(...keys)) ?? []
      let batchBytes = 0
      let batchUsers = 0
      for (const shard of shards) {
        if (shard) {
          batchBytes += Buffer.byteLength(JSON.stringify(shard), 'utf8')
          batchUsers += shard.length
          out.push(...shard)
        }
      }
      console.warn(
        `[users:read] batch ${batchNum}/${totalBatches}: buckets [${slice.join(', ')}], ${batchUsers} users, ${fmtMB(batchBytes)} MB`,
      )
    } catch (err) {
      console.error(
        `[users:read] batch ${batchNum}/${totalBatches} FAILED for buckets [${slice.join(', ')}]:`,
        err instanceof Error ? err.message : err,
      )
      throw err
    }
  }

  return out
}
