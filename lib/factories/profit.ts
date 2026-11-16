/**
 * Pure daily-profit model for a user's factories (companies).
 *
 * Inputs come from WarEra: `company.getById` (identity + item + region + engine
 * level), `employee.getCompanyEstimate` (the NPC employees' hourly production
 * points and wages, plus the manager's wage), and `itemTrading.getPrices` +
 * `gameConfig.items` (sell prices and recipes). Nothing here calls the API; the
 * callers fetch and feed plain data in.
 *
 * Key unit fact: production is in POINTS per day (engine + employees), not item
 * units. Units = points / productionPoints[item]. Employee points already include
 * each employee's production bonus (management, manager, tool, specialization,
 * happiness, …); the engine has no bonus. A factory's region doesn't affect its
 * output.
 */

/**
 * One item's production recipe from `gameConfig.items`: the cost in production
 * points to make one unit, plus the raw inputs consumed per unit. Raw resources
 * (iron, fish, …) have an empty `productionNeeds` because they're mined.
 */
export interface Recipe {
  productionPoints: number
  productionNeeds: Record<string, number>
}

/**
 * Item code → recipe, derived once from `gameConfig.items`.
 */
export type RecipeLookup = Record<string, Recipe>

/**
 * Item code → current market price in gold, from `itemTrading.getPrices`.
 */
export type ItemPrices = Record<string, number>

/**
 * The single most profitable item to produce right now: the item that earns the
 * most gold per production point, net of its inputs. It is the same in every
 * region.
 */
export interface Frontier {
  itemCode: string
  netPerPoint: number
}

/**
 * The per-factory data the model needs, all per day. `enginePointsPerDay` and
 * `employeePointsPerDay` are production points from the engine and the NPC
 * employees; `wagePerDay` is the employees' wages and `managerPerDay` the
 * manager's, both paid by the owner.
 */
export interface FactoryInput {
  id: string
  name: string
  itemCode: string
  regionName: string
  employeeCount: number
  employeeCap: number
  enginePointsPerDay: number
  employeePointsPerDay: number
  wagePerDay: number
  managerPerDay: number
}

/**
 * One raw input a factory consumes per day, with its gold cost.
 */
export interface InputCost {
  code: string
  qtyPerDay: number
  costPerDay: number
}

/**
 * A factory's computed daily economics, ready to render.
 */
export interface FactoryProfit {
  id: string
  name: string
  regionName: string
  itemCode: string
  employeeCount: number
  employeeCap: number

  /**
   * Production points/day (engine + employees). Summed into the entity PP
   * aggregates; units = pointsPerDay / productionPoints.
   */
  pointsPerDay: number
  enginePointsPerDay: number
  employeePointsPerDay: number
  unitsPerDay: number
  sellPrice: number
  revenuePerDay: number
  inputs: InputCost[]
  inputCostPerDay: number
  wagePerDay: number
  managerPerDay: number
  netPerDay: number
  isIdle: boolean

  /**
   * Top potential: the same production points spent on the most profitable item
   * instead. Approximate, since employees' item specialization bonus would not
   * carry over. Always ≥ net when a frontier is known.
   */
  bestProductCode: string
  bestPotentialNetPerDay: number
  bestOpportunityPerDay: number
}

/**
 * Portfolio roll-up across a user's factories.
 */
export interface PortfolioTotals {
  count: number
  activeCount: number
  revenuePerDay: number
  costPerDay: number
  netPerDay: number
  bestPotentialNetPerDay: number
  bestOpportunityPerDay: number
}

/**
 * Builds the recipe lookup from `gameConfig.items`, keeping only items that
 * carry production points (i.e. things a factory can make). Read live, never
 * hardcoded: the live catalog has items the SDK types omit (paper, wood, …).
 */
export function buildRecipeLookup(
  items: Record<string, { productionPoints?: number, productionNeeds?: Record<string, number> }>,
): RecipeLookup {
  const out: RecipeLookup = {}

  for (const [code, item] of Object.entries(items)) {
    if (typeof item.productionPoints === 'number') {
      out[code] = {
        productionPoints: item.productionPoints,
        productionNeeds: item.productionNeeds ?? {},
      }
    }
  }

  return out
}

/**
 * Gold profit from one unit of `code`: its sell price minus the market cost of
 * the raw inputs it consumes. Returns null when the item or any input price is
 * unknown, so callers can skip rather than show a wrong number.
 */
export function netPerUnit(code: string, prices: ItemPrices, recipe: RecipeLookup): number | null {
  const r = recipe[code]
  const sell = prices[code]
  if (!r || sell == null) {
    return null
  }

  let inputCost = 0
  for (const [input, qty] of Object.entries(r.productionNeeds)) {
    const price = prices[input]
    if (price == null) {
      return null
    }

    inputCost += qty * price
  }

  return sell - inputCost
}

/**
 * Builds the production frontier: across every producible item, the one that
 * earns the most gold per production point, net of input cost.
 */
export function buildFrontier(prices: ItemPrices, recipe: RecipeLookup): Frontier | null {
  let best: Frontier | null = null

  for (const code of Object.keys(recipe)) {
    const unit = netPerUnit(code, prices, recipe)
    const productionPoints = recipe[code].productionPoints
    if (unit == null || productionPoints <= 0) {
      continue
    }

    const netPerPoint = unit / productionPoints
    if (!best || netPerPoint > best.netPerPoint) {
      best = { itemCode: code, netPerPoint }
    }
  }

  return best
}

/**
 * Computes one factory's daily economics, plus the Top potential: the same
 * production points spent on the frontier item. Compute `frontier` once and pass
 * it in.
 */
export function computeFactoryProfit(
  input: FactoryInput,
  prices: ItemPrices,
  recipe: RecipeLookup,
  frontier: Frontier | null,
): FactoryProfit {
  const r = recipe[input.itemCode]
  const productionPoints = r?.productionPoints ?? 1
  const pointsPerDay = input.enginePointsPerDay + input.employeePointsPerDay
  const unitsPerDay = pointsPerDay / productionPoints
  const sellPrice = prices[input.itemCode] ?? 0

  const revenuePerDay = unitsPerDay * sellPrice
  const inputs: InputCost[] = []
  let inputCostPerDay = 0
  for (const [code, qtyPerUnit] of Object.entries(r?.productionNeeds ?? {})) {
    const qtyPerDay = unitsPerDay * qtyPerUnit
    const costPerDay = qtyPerDay * (prices[code] ?? 0)
    inputs.push({ code, qtyPerDay, costPerDay })
    inputCostPerDay += costPerDay
  }

  const staffPerDay = input.wagePerDay + input.managerPerDay
  const netPerDay = revenuePerDay - inputCostPerDay - staffPerDay

  const bestPotentialNetPerDay = frontier && pointsPerDay > 0
    ? Math.max(netPerDay, pointsPerDay * frontier.netPerPoint - staffPerDay)
    : netPerDay

  return {
    id: input.id,
    name: input.name,
    regionName: input.regionName,
    itemCode: input.itemCode,
    employeeCount: input.employeeCount,
    employeeCap: input.employeeCap,
    pointsPerDay,
    enginePointsPerDay: input.enginePointsPerDay,
    employeePointsPerDay: input.employeePointsPerDay,
    unitsPerDay,
    sellPrice,
    revenuePerDay,
    inputs,
    inputCostPerDay,
    wagePerDay: input.wagePerDay,
    managerPerDay: input.managerPerDay,
    netPerDay,
    isIdle: pointsPerDay <= 0,
    bestProductCode: frontier?.itemCode ?? input.itemCode,
    bestPotentialNetPerDay,
    bestOpportunityPerDay: Math.max(0, bestPotentialNetPerDay - netPerDay),
  }
}

/**
 * One user's factory totals, written per user by the all-users factory scrape
 * and rolled up into the MU / Country / Alliance aggregate columns. `ppPerDay`
 * is production points/day; the net/potential sums are gold/day.
 */
export interface UserFactoryAgg {
  factoryCount: number

  ppPerDay: number
  netPerDay: number

  /**
   * Net split by source: engine vs employees (net of wages and manager).
   * engineNetPerDay + employeeNetPerDay = netPerDay.
   */
  engineNetPerDay: number
  topPotentialNetPerDay: number

  /**
   * Null when any factory's roster is unknown, so a missing roster never reads
   * as an empty one.
   */
  workerCount: number | null
  employeeNetPerDay: number | null
  payrollPerDay: number | null

  /**
   * From the stored roster. The averages are also null when there are no
   * employees.
   */
  employeeAvgPpPerDay: number | null
  employeeAvgHappiness: number | null
  employeeRetiringSoon: number | null
}

/**
 * Sums a set of computed factories into a portfolio roll-up.
 */
export function portfolioTotals(rows: FactoryProfit[]): PortfolioTotals {
  const totals: PortfolioTotals = {
    count: rows.length,
    activeCount: 0,
    revenuePerDay: 0,
    costPerDay: 0,
    netPerDay: 0,
    bestPotentialNetPerDay: 0,
    bestOpportunityPerDay: 0,
  }

  for (const row of rows) {
    if (!row.isIdle) {
      totals.activeCount += 1
    }

    totals.revenuePerDay += row.revenuePerDay
    totals.costPerDay += row.inputCostPerDay + row.wagePerDay + row.managerPerDay
    totals.netPerDay += row.netPerDay
    totals.bestPotentialNetPerDay += row.bestPotentialNetPerDay
    totals.bestOpportunityPerDay += row.bestOpportunityPerDay
  }

  return totals
}
