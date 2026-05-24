import type { CountryRow, UserRow } from '@/lib/rows'

import type { RankingTier } from '@/lib/warera/schemas'
import { computePoints } from '@/lib/scoring'
import { RANKING_TIERS } from '@/lib/warera/schemas'

import { readAllUsers, readSnapshot } from './snapshot'

// Build-time guard: fails the build if any client component ever imports this
// file (which holds the Redis token + in-process cache).
import 'server-only'

/**
 * In-process snapshot cache, scoped to a single Vercel function worker. Loads
 * the entire snapshot from Redis on first access, then serves all subsequent
 * reads from memory until the TTL expires. Each cold worker pays the load cost
 * once; warm workers serve sub-millisecond reads.
 *
 * Trade-off: warm workers may serve up to TTL_MS-old data after a scrape
 * completes. Acceptable since scrapes run every 4 hours.
 */

const TTL_MS = 5 * 60 * 1000

interface Snapshot {
  users: UserRow[]
  countries: CountryRow[]
}

interface CacheEntry {
  loadedAt: number
  promise: Promise<Snapshot>
}

let cache: CacheEntry | null = null

function toTier(value: unknown): RankingTier | null {
  return typeof value === 'string' && (RANKING_TIERS as readonly string[]).includes(value)
    ? (value as RankingTier)
    : null
}

async function loadFromRedis(): Promise<Snapshot> {
  const [users, countries, mus] = await Promise.all([
    readAllUsers(),
    readSnapshot('countries'),
    readSnapshot('mus'),
  ])

  const countryLookup = new Map(countries.map(c => [c._id, { name: c.name, code: c.code }]))
  const muLookup = new Map(mus.map(m => [m._id, m.name]))

  const userRows: UserRow[] = users
    .map((u) => {
      const country = countryLookup.get(u.country)
      const level = u.rankings?.userLevel
      const damage = u.rankings?.userDamages
      const wealth = u.rankings?.userWealth
      // `u.infos.isBanned` is set on banned accounts; absent or false otherwise.
      const infos = (u as { infos?: { isBanned?: boolean } }).infos
      const dates = (u as { dates?: { lastConnectionAt?: string } }).dates
      const levelValue = u.leveling?.level ?? null
      const damageValue = damage?.value ?? null
      const wealthValue = wealth?.value ?? null
      return {
        id: u._id,
        username: u.username,
        countryId: u.country,
        countryCode: country?.code ?? null,
        countryName: country?.name ?? null,
        level: levelValue,
        levelRank: level?.rank ?? null,
        levelTier: toTier(level?.tier),
        damageRank: damage?.rank ?? null,
        damageValue,
        wealthRank: wealth?.rank ?? null,
        wealthValue,
        militaryRank: u.militaryRank ?? null,
        muName: u.mu ? (muLookup.get(u.mu) ?? null) : null,
        lastConnectionAt: dates?.lastConnectionAt ?? null,
        isBanned: infos?.isBanned === true,
        points: computePoints({ level: levelValue, damageValue, wealthValue }),
      }
    })
    .filter(r => r.levelRank !== null)
    .sort((a, b) => (a.levelRank ?? Infinity) - (b.levelRank ?? Infinity))

  const pointsByCountry = new Map<string, { total: number, count: number }>()
  for (const u of userRows) {
    const entry = pointsByCountry.get(u.countryId) ?? { total: 0, count: 0 }
    entry.total += u.points
    entry.count += 1
    pointsByCountry.set(u.countryId, entry)
  }

  const countryRows: CountryRow[] = countries
    .map((c) => {
      const agg = pointsByCountry.get(c._id)
      return {
        id: c._id,
        name: c.name,
        code: c.code,
        damageRank: c.rankings?.countryDamages?.rank ?? null,
        damageValue: c.rankings?.countryDamages?.value ?? null,
        damageTier: c.rankings?.countryDamages?.tier ?? null,
        weeklyDamageValue: c.rankings?.weeklyCountryDamages?.value ?? null,
        wealthRank: c.rankings?.countryWealth?.rank ?? null,
        wealthValue: c.rankings?.countryWealth?.value ?? null,
        development: c.development ?? null,
        activePopulation: c.rankings?.countryActivePopulation?.value ?? null,
        totalPoints: agg?.total ?? 0,
        avgPoints: agg ? Math.round(agg.total / agg.count) : null,
      }
    })
    .sort((a, b) => {
      if (a.damageRank === null) {
        return 1
      }
      if (b.damageRank === null) {
        return -1
      }
      return a.damageRank - b.damageRank
    })

  return { users: userRows, countries: countryRows }
}

export function getSnapshot(): Promise<Snapshot> {
  const now = Date.now()
  if (cache && now - cache.loadedAt < TTL_MS) {
    return cache.promise
  }
  const promise = loadFromRedis()
  cache = { loadedAt: now, promise }
  // If the load fails, drop the cache so the next request retries instead of
  // serving a permanently-rejected promise.
  promise.catch(() => {
    if (cache?.promise === promise) {
      cache = null
    }
  })
  return promise
}

/**
 * Manually drop the cache. Useful after /api/refresh writes new data.
 */
export function invalidateSnapshot() {
  cache = null
}
