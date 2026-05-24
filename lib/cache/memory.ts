import type { CountryRow, MURow, PartyRow, UserRow } from '@/lib/rows'

import { buildCountryRows } from '@/lib/rows/build-countries'
import { buildMURows } from '@/lib/rows/build-mus'
import { buildPartyRows } from '@/lib/rows/build-parties'
import { buildUserRows } from '@/lib/rows/build-users'
import { buildLookups } from '@/lib/rows/lookups'

import { readAllUsers, readSnapshot } from './snapshot'

// Build-time guard: fails the build if any client component ever imports this
// file (which holds the Redis token + in-process cache).
import 'server-only'

/**
 * In-process snapshot cache, scoped to a single Node process. Loads the
 * entire snapshot from Redis on first access, then serves all subsequent
 * reads from memory.
 *
 * Stale-while-revalidate: after TTL_MS, the cached snapshot keeps being
 * served while a background refresh runs. Only the very first request to a
 * cold process pays the load cost; once warm, no user ever blocks on a
 * refresh.
 *
 * Trade-off: warm processes may serve up to TTL_MS-old data after a scrape
 * completes. Acceptable since scrapes run hourly.
 */

const TTL_MS = 5 * 60 * 1000

interface Snapshot {
  users: UserRow[]
  countries: CountryRow[]
  mus: MURow[]
  parties: PartyRow[]
}

interface CacheEntry {
  loadedAt: number
  promise: Promise<Snapshot>
}

let cache: CacheEntry | null = null
let refreshing: Promise<Snapshot> | null = null

async function loadFromRedis(): Promise<Snapshot> {
  const [users, countries, mus, regions, parties] = await Promise.all([
    readAllUsers(),
    readSnapshot('countries'),
    readSnapshot('mus'),
    readSnapshot('regions'),
    readSnapshot('parties'),
  ])

  const lookups = buildLookups(countries, mus, regions, users, parties)
  const userRows = buildUserRows(users, lookups)
  const countryRows = buildCountryRows(countries, mus, userRows, lookups)
  const muRows = buildMURows(mus, userRows, lookups)
  const partyRows = buildPartyRows(parties, userRows, lookups)

  return { users: userRows, countries: countryRows, mus: muRows, parties: partyRows }
}

export function getSnapshot(): Promise<Snapshot> {
  const now = Date.now()

  // Cold cache: caller has to wait for the first load.
  if (!cache) {
    const promise = loadFromRedis()
    cache = { loadedAt: now, promise }
    promise.catch(() => {
      if (cache?.promise === promise) {
        cache = null
      }
    })
    return promise
  }

  // Warm cache, possibly stale: serve current snapshot immediately and kick
  // off a background refresh if past TTL. A single in-flight refresh is
  // shared across concurrent requests.
  if (now - cache.loadedAt >= TTL_MS && !refreshing) {
    refreshing = loadFromRedis()
    refreshing.then(
      () => {
        cache = { loadedAt: Date.now(), promise: refreshing! }
      },
      () => {
        // Refresh failed; keep serving the stale snapshot. The next request
        // past TTL will trigger another attempt.
      },
    ).finally(() => {
      refreshing = null
    })
  }

  return cache.promise
}
