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
 * Live active battles, cached for a minute.
 *
 * Stale-while-revalidate, so a slow WarEra fetch delays freshness instead of
 * blocking renders.
 *
 * A failed fetch serves an empty list: the live layer is an extra, and the API
 * 503s under load.
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
 * Live battles by country id, each from that country's side. Tournament sides
 * are MUs, so they never match a country.
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
 * Stamps live battle counts onto copies of the rows, so the ⚔ pill needs no
 * client fetch.
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
