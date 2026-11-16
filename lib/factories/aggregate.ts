import type { ItemPrices, UserFactoryAgg } from './profit'
import type { RawSnapshot } from '@/lib/cache/file-store'

import { streamFactoryUsers } from '@/lib/cache/factory-store'

import { recipeFromGameConfig } from './inputs'
import { buildFrontier, computeFactoryProfit, netPerUnit } from './profit'

/**
 * Employees this close to retirement count as retiring soon.
 */
const RETIRING_SOON_DAYS = 7

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
    let factoryCount = 0
    let ppPerDay = 0
    let netPerDay = 0
    let engineNetPerDay = 0
    let topPotentialNetPerDay = 0

    let rosterKnown = true
    let workers = 0
    let employeeNet = 0
    let payroll = 0
    let employeePtsSum = 0

    let detailsKnown = true
    let happinessSum = 0
    let retiring = 0

    for (const r of rows) {
      // A line without `wagePerDay` carries no NPC employee data (its
      // employeePoints count player workers), so it counts as engine-only until
      // the next pass rewrites the file.
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

      factoryCount += 1
      ppPerDay += profit.pointsPerDay
      netPerDay += profit.netPerDay
      topPotentialNetPerDay += profit.bestPotentialNetPerDay

      // Engine net (no wage) + employee net (output value − wages − manager);
      // together they equal profit.netPerDay.
      const vpp = valuePerPp(r.itemCode)
      engineNetPerDay += enginePts * vpp
      employeeNet += employeePts * vpp - wagePerDay - managerPerDay

      rosterKnown &&= !isLegacy && !r.rosterMissing
      workers += r.employeeCount ?? 0
      payroll += wagePerDay + managerPerDay
      employeePtsSum += employeePts

      detailsKnown &&= r.employees !== undefined
      for (const e of r.employees ?? []) {
        happinessSum += e.happiness
        if (e.retireInDays <= RETIRING_SOON_DAYS) {
          retiring++
        }
      }
    }

    const known = (v: number) => (rosterKnown ? v : null)
    const details = rosterKnown && detailsKnown

    out.set(userId, {
      factoryCount,
      ppPerDay,
      netPerDay,
      engineNetPerDay,
      topPotentialNetPerDay,
      workerCount: known(workers),
      employeeNetPerDay: known(employeeNet),
      payrollPerDay: known(payroll),
      employeeAvgPpPerDay: rosterKnown && workers > 0 ? employeePtsSum / workers : null,
      employeeAvgNetPerDay: rosterKnown && workers > 0 ? employeeNet / workers : null,
      employeeAvgHappiness: details && workers > 0 ? happinessSum / workers : null,
      employeeRetiringSoon: details ? retiring : null,
    })
  })

  return out
}
