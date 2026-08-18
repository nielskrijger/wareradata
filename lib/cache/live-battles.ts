import type { ActiveBattleSummary, BattleRow, CountryRow } from '@/lib/rows'

import { cacheLife } from 'next/cache'

import { logger } from '@/lib/log'
import { buildBattleRows } from '@/lib/rows/build-battles'
import { getActiveBattles } from '@/lib/warera/api'

import { getSnapshot } from './memory'

// Build-time guard: holds the WarEra API key path; server-only.
import 'server-only'

const log = logger.child({ component: 'live-battles' })

/**
 * Live active battles as enriched {@link BattleRow}s, cached via Cache
 * Components. Backs both the /battles active tab and the active-battle
 * detail page, so a click-through stays consistent within the cache window.
 *
 * Stale-while-revalidate: past `revalidate` the cached rows are served as-is
 * and refreshed in the background, so a slow WarEra fetch (rate-limiter queue,
 * API under load) delays freshness instead of blocking every render. Only
 * after a full hour without a successful refresh does a request block on the
 * fetch (`expire`).
 *
 * The live layer is an enhancement, not load-bearing: if the WarEra API is
 * down (it 503s under load), we degrade to an empty list rather than crashing
 * every page that shows the ⚔ pill. The empty list itself gets cached for the
 * full revalidate window — acceptable trade for letting the framework own the
 * TTL.
 */
export async function getLiveActiveBattles(): Promise<BattleRow[]> {
  'use cache'
  cacheLife({ stale: 60, revalidate: 60, expire: 3600 })
  try {
    // Enrich the raw live battles against the warm snapshot lookups (country
    // / MU / region names, tournament team → MU), exactly as the hourly rows
    // are.
    const [battles, snapshot] = await Promise.all([getActiveBattles(), getSnapshot()])
    return buildBattleRows(battles, snapshot.tournament, snapshot.lookups)
  } catch (err) {
    log.warn({ err }, 'active-battle fetch failed, serving empty')
    return []
  }
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
