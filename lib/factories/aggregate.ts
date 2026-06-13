import type { ItemPrices, UserFactoryAgg } from './profit'
import type { RawSnapshot } from '@/lib/cache/file-store'

import { streamFactoryUsers } from '@/lib/cache/factory-store'

import { recipeFromGameConfig } from './inputs'
import { aggregateUserFactories, buildFrontier, computeFactoryProfit } from './profit'

/**
 * Streams the factory NDJSON file and computes each user's factory totals from
 * the raw rows plus the snapshot's market data (prices + best-region frontier).
 * Only the small per-user aggregate map is retained — raw rows are parsed and
 * discarded one line at a time, so a full factory dataset never materializes in
 * memory. Region names aren't needed (the aggregate is pure numbers), so no
 * lookups are required here. Returns an empty map when the file doesn't exist.
 */
export async function loadFactoryAggregates(
  raw: Pick<RawSnapshot, 'prices' | 'itemBestRegions' | 'gameConfig'>,
): Promise<Map<string, UserFactoryAgg>> {
  const prices = raw.prices as unknown as ItemPrices
  const recipe = recipeFromGameConfig(raw.gameConfig)

  // Best-region bonus per item, with region names stripped (unused in the math).
  const itemBonus = Object.fromEntries(
    Object.entries(raw.itemBestRegions).map(([code, r]) => [code, {
      bonusPct: r.bonusPct,
      regionName: '',
      strategicPct: r.strategicPct,
      ethicSpecializationPct: r.ethicSpecializationPct,
      depositPct: r.depositPct,
      ethicDepositPct: r.ethicDepositPct,
      depositEndAt: r.depositEndAt,
    }]),
  )
  const frontier = buildFrontier(prices, recipe, itemBonus)

  const out = new Map<string, UserFactoryAgg>()
  await streamFactoryUsers(({ userId, rows }) => {
    const profits = rows.map(r => computeFactoryProfit(
      {
        id: '',
        name: '',
        itemCode: r.itemCode,
        regionName: '',
        bonusPct: r.bonusPct,
        workerCount: r.workerCount,
        pointsPerDay: r.pointsPerDay,
        grossWagePerDay: r.grossWagePerDay,
      },
      prices,
      recipe,
      itemBonus,
      frontier,
    ))
    out.set(userId, aggregateUserFactories(profits))
  })

  return out
}
