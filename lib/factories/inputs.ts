import type { FactoryInput, ItemBonusInfo, RecipeLookup } from './profit'
import type { FactoryData, GameConfig, ItemBestRegion } from '@/lib/warera/api'

import { buildRecipeLookup } from './profit'

/**
 * Builds the recipe lookup from the game config. gameConfig.items is a fixed
 * struct in the SDK types, not an index signature, so widen it; buildRecipeLookup
 * only reads productionPoints/productionNeeds.
 */
export function recipeFromGameConfig(gameConfig: GameConfig): RecipeLookup {
  return buildRecipeLookup(gameConfig.items as unknown as Record<string, { productionPoints?: number, productionNeeds?: Record<string, number> }>)
}

/**
 * Averages a work-stat over the user's complete days, dropping the most recent
 * (today's partial day). Returns 0 when there's no usable history.
 */
export function avgCompleteStat(stats: FactoryData['stats'], key: 'total' | 'wage'): number {
  const sorted = [...stats].sort((a, b) => a.dailyDate.localeCompare(b.dailyDate))
  const complete = sorted.length > 1 ? sorted.slice(0, -1) : sorted
  if (!complete.length) {
    return 0
  }

  return complete.reduce((acc, day) => acc + (day[key] ?? 0), 0) / complete.length
}

/**
 * Resolves the scraped per-item best-region map into the profit model's
 * ItemBonusInfo, attaching region names from the caller's resolver.
 */
export function buildItemBonus(
  bestRegions: Record<string, ItemBestRegion>,
  regionName: (id: string) => string,
): Record<string, ItemBonusInfo> {
  return Object.fromEntries(
    Object.entries(bestRegions).map(([code, r]) => [code, {
      bonusPct: r.bonusPct,
      regionName: regionName(r.regionId),
      strategicPct: r.strategicPct,
      ethicSpecializationPct: r.ethicSpecializationPct,
      depositPct: r.depositPct,
      ethicDepositPct: r.ethicDepositPct,
      depositEndAt: r.depositEndAt,
    }]),
  )
}

/**
 * Maps one fetched factory into the profit model's input.
 */
export function factoryInputFromData(f: FactoryData, regionName: (id: string) => string): FactoryInput {
  return {
    id: f.company._id,
    name: f.company.name,
    itemCode: f.company.itemCode,
    regionName: regionName(f.company.region),
    bonusPct: f.bonus?.total ?? 0,
    workerCount: Array.isArray(f.company.workers) ? f.company.workers.length : 0,
    pointsPerDay: avgCompleteStat(f.stats, 'total'),
    grossWagePerDay: avgCompleteStat(f.stats, 'wage'),
  }
}
