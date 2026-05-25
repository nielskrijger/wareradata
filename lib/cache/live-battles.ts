import type { ActiveBattleSummary, BattleRow, CountryRow } from '@/lib/rows'

import { buildBattleRows } from '@/lib/rows/build-battles'
import { getActiveBattles } from '@/lib/warera/api'

import { getSnapshot } from './memory'

// Build-time guard: holds the WarEra API key path; server-only.
import 'server-only'

// Active battles are fetched live on demand (not from the hourly snapshot) so
// the score / round damage / top dealers stay current. A short in-process TTL
// means concurrent viewers and rapid refreshes share a single API hit; the
// WarEra battle endpoint is cheap (~15 active battles, one page) so this is the
// only freshness layer we need.
const TTL_MS = 60 * 1000

interface CacheEntry {
  loadedAt: number
  promise: Promise<BattleRow[]>
}

let cache: CacheEntry | null = null

async function load(): Promise<BattleRow[]> {
  // Enrich the raw live battles against the warm snapshot lookups (country / MU
  // / region names, tournament team → MU), exactly as the hourly rows are.
  const [battles, snapshot] = await Promise.all([getActiveBattles(), getSnapshot()])
  return buildBattleRows(battles, snapshot.tournament, snapshot.lookups)
}

/**
 * Live active battles as enriched {@link BattleRow}s, cached for {@link TTL_MS}.
 * Backs both the /battles active tab and the active-battle detail page, so a
 * click-through stays consistent within the cache window.
 */
export function getLiveActiveBattles(): Promise<BattleRow[]> {
  const now = Date.now()
  if (cache && now - cache.loadedAt < TTL_MS) {
    return cache.promise
  }
  const promise = load()
  cache = { loadedAt: now, promise }
  // Drop a failed fetch so the next caller retries instead of caching a reject.
  promise.catch(() => {
    if (cache?.promise === promise) {
      cache = null
    }
  })
  return promise
}

/**
 * Per-country active battles, derived from the same cached live set (no extra
 * API call). A battle is listed under both its attacker and defender country,
 * each from that country's own point of view (opponent = the other side).
 * Tournament battles have MU sides, so their ids never match a country and are
 * naturally excluded. Keyed by country id.
 */
export async function getActiveBattlesByCountry(): Promise<Map<string, ActiveBattleSummary[]>> {
  const battles = await getLiveActiveBattles()
  const byCountry = new Map<string, ActiveBattleSummary[]>()
  for (const b of battles) {
    for (const side of [b.attacker, b.defender]) {
      if (side.kind !== 'country' || !side.id) {
        continue
      }
      const opponent = side === b.attacker ? b.defender : b.attacker
      const list = byCountry.get(side.id) ?? []
      list.push({
        id: b.id,
        opponentName: opponent.name,
        opponentCode: opponent.code,
        regionName: b.regionName,
        isResistance: b.isResistance,
        isTournament: b.isTournament,
      })
      byCountry.set(side.id, list)
    }
  }
  return byCountry
}

/**
 * Stamps the live active-battle count and matchup list onto country rows, so
 * the ⚔ pill (and its hover tooltip) show site-wide without a client fetch.
 * Returns new rows (doesn't mutate the cached snapshot rows). Call on any path
 * that serves CountryRows for display.
 */
export async function withActiveBattleCounts(rows: CountryRow[]): Promise<CountryRow[]> {
  const byCountry = await getActiveBattlesByCountry()
  if (!byCountry.size) {
    return rows
  }
  return rows.map((r) => {
    const list = byCountry.get(r.id) ?? []
    return { ...r, activeBattles: list.length, activeBattlesList: list }
  })
}
