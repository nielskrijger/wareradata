import type { ItemPrices, UserFactoryAgg } from './profit'
import type { RawSnapshot } from '@/lib/cache/file-store'

import { streamFactoryUsers } from '@/lib/cache/factory-store'

import { recipeFromGameConfig } from './inputs'
import { buildFrontier, computeFactoryProfit, netPerUnit } from './profit'

/**
 * Streams the factory NDJSON file and computes each user's factory totals from
 * the raw rows plus the snapshot's market data (prices + recipes). Only the small
 * per-user aggregate map is retained — raw rows are parsed and discarded one line
 * at a time, so a full factory dataset never materializes in memory. Returns an
 * empty map when the file doesn't exist.
 */
export async function loadFactoryAggregates(
  raw: Pick<RawSnapshot, 'prices' | 'gameConfig'>,
): Promise<Map<string, UserFactoryAgg>> {
  const prices = raw.prices as unknown as ItemPrices
  const recipe = recipeFromGameConfig(raw.gameConfig)
  const frontier = buildFrontier(prices, recipe)

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
      // Lines written before the employee rework have no `wagePerDay`, and their
      // employeePoints are for the old player workers: count them as engine-only
      // until the next pass rewrites the file.
      const isLegacy = r.wagePerDay === undefined
      const enginePts = r.enginePoints ?? 0
      const employeePts = isLegacy ? 0 : (r.employeePoints ?? 0)
      const wagePerDay = r.wagePerDay ?? 0
      const managerPerDay = r.managerPerDay ?? 0

      const profit = computeFactoryProfit(
        {
          id: '',
          name: '',
          itemCode: r.itemCode,
          regionName: '',
          employeeCount: r.employeeCount ?? 0,
          employeeCap: r.employeeCap ?? 0,
          enginePointsPerDay: enginePts,
          employeePointsPerDay: employeePts,
          wagePerDay,
          managerPerDay,
        },
        prices,
        recipe,
        frontier,
      )

      agg.factoryCount += 1
      agg.workerCount += r.employeeCount ?? 0
      agg.ppPerDay += profit.pointsPerDay
      agg.netPerDay += profit.netPerDay
      agg.topPotentialNetPerDay += profit.bestPotentialNetPerDay

      // Engine net (no wage) + employee net (output value − wages − manager);
      // together they equal profit.netPerDay.
      const vpp = valuePerPp(r.itemCode)
      agg.engineNetPerDay += enginePts * vpp
      agg.employeeNetPerDay += employeePts * vpp - wagePerDay - managerPerDay
    }

    out.set(userId, agg)
  })

  return out
}
