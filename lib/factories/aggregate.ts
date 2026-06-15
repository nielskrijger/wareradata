import type { ItemPrices, UserFactoryAgg } from './profit'
import type { RawSnapshot } from '@/lib/cache/file-store'

import { streamFactoryUsers } from '@/lib/cache/factory-store'

import { recipeFromGameConfig } from './inputs'
import { buildFrontier, computeFactoryProfit, netPerUnit } from './profit'

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

  // Net gold per production point (revenue net of inputs ÷ point cost), memoized
  // per item — many factories share an item, so this runs once per item instead
  // of re-walking the recipe for every factory row.
  const valuePerPpByItem = new Map<string, number>()
  const valuePerPp = (itemCode: string): number => {
    let v = valuePerPpByItem.get(itemCode)
    if (v === undefined) {
      v = (netPerUnit(itemCode, prices, recipe) ?? 0) / (recipe[itemCode]?.productionPoints ?? 1)
      valuePerPpByItem.set(itemCode, v)
    }
    return v
  }

  const out = new Map<string, UserFactoryAgg>()
  await streamFactoryUsers(({ userId, rows }) => {
    const agg: UserFactoryAgg = { factoryCount: 0, workerCount: 0, ppPerDay: 0, netPerDay: 0, engineNetPerDay: 0, employeeNetPerDay: 0, topPotentialNetPerDay: 0 }

    for (const r of rows) {
      // Theoretical production (engine + workers at full daily effort), already
      // excluding self-work. Legacy lines stored only a combined `pointsPerDay`;
      // fall back to it so Net/day keeps working until the next pass rewrites the
      // file in the per-source shape.
      const hasSplit = r.enginePoints !== undefined || r.employeePoints !== undefined
      const enginePts = r.enginePoints ?? 0
      const employeePts = r.employeePoints ?? 0
      const effPts = hasSplit ? enginePts + employeePts : (r.pointsPerDay ?? 0)

      const profit = computeFactoryProfit(
        { id: '', name: '', itemCode: r.itemCode, regionName: '', bonusPct: r.bonusPct, workerCount: r.workerCount, pointsPerDay: effPts, grossWagePerDay: r.grossWagePerDay },
        prices,
        recipe,
        itemBonus,
        frontier,
      )

      agg.factoryCount += 1
      agg.workerCount += r.workerCount
      agg.ppPerDay += effPts
      agg.netPerDay += profit.netPerDay
      agg.topPotentialNetPerDay += profit.bestPotentialNetPerDay

      // Engine net (no wage) + employee net (output value − wages); together they
      // equal profit.netPerDay. Unknown on legacy lines (no split), so left at 0
      // there — the combined Net/day above still holds.
      if (hasSplit) {
        const vpp = valuePerPp(r.itemCode)
        agg.engineNetPerDay += enginePts * vpp
        agg.employeeNetPerDay += employeePts * vpp - r.grossWagePerDay
      }
    }

    out.set(userId, agg)
  })

  return out
}
