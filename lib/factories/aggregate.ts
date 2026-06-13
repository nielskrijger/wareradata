import type { ItemPrices, RecipeLookup, UserFactoryAgg } from './profit'
import type { FactorySnapshot } from '@/lib/cache/factory-store'
import type { ItemBestRegion, MarketPrices } from '@/lib/warera/api'

import { buildItemBonus } from './inputs'
import { aggregateUserFactories, buildFrontier, computeFactoryProfit } from './profit'

/**
 * Computes each user's factory totals from the raw factory snapshot plus the
 * market data (prices + best-region frontier) captured in the main snapshot.
 * Pure: the row builders call this at build time, no network. Returns a map
 * keyed by user id; users absent from the factory snapshot simply aren't in it.
 */
export function buildUserFactoryAggregates(
  factory: FactorySnapshot,
  prices: MarketPrices,
  itemBestRegions: Record<string, ItemBestRegion>,
  recipe: RecipeLookup,
  regionName: (id: string) => string,
): Map<string, UserFactoryAgg> {
  const priceMap = prices as unknown as ItemPrices
  const itemBonus = buildItemBonus(itemBestRegions, regionName)
  const frontier = buildFrontier(priceMap, recipe, itemBonus)

  const out = new Map<string, UserFactoryAgg>()
  for (const [userId, rows] of Object.entries(factory.byUser)) {
    const profits = rows.map(r => computeFactoryProfit(
      {
        id: '',
        name: '',
        itemCode: r.itemCode,
        regionName: regionName(r.regionId),
        bonusPct: r.bonusPct,
        workerCount: r.workerCount,
        pointsPerDay: r.pointsPerDay,
        grossWagePerDay: r.grossWagePerDay,
      },
      priceMap,
      recipe,
      itemBonus,
      frontier,
    ))
    out.set(userId, aggregateUserFactories(profits))
  }

  return out
}
