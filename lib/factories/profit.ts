/**
 * Pure daily-profit model for a user's factories (companies).
 *
 * Inputs come from WarEra: `company.getById` (identity + item + region),
 * `work.getStatsByCompany` (daily production, already bonus-inclusive),
 * `company.getProductionBonus` (the factory's current item bonus),
 * `itemTrading.getPrices` + `gameConfig.items` (sell prices and recipes), and
 * `company.getRecommendedRegionIdsByItemCode` scraped per item (the global best
 * region + bonus for each item). Nothing here calls the API; the page fetches
 * and feeds plain data in.
 *
 * Key unit fact: work-stats values are production POINTS per day, not item
 * units. Units = points / productionPoints[item]. The production bonus is a
 * multiplier on output, so base capacity = points / (1 + bonus).
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
 * Item code → its best region's total production bonus (percent) and that
 * region's name, scraped from `company.getRecommendedRegionIdsByItemCode`. This
 * is a global frontier (best region per item), not any one factory's region.
 */
export interface ItemBonusInfo {
  // Total best-region bonus (the parts below sum to this).
  bonusPct: number
  regionName: string
  // Permanent parts: country strategic resources + ethic specialization.
  strategicPct: number
  ethicSpecializationPct: number
  // Temporary parts: the region's deposit (expires at depositEndAt) + its ethic bonus.
  depositPct: number
  ethicDepositPct: number
  depositEndAt?: string
}

/**
 * A production bonus split into the parts that stick around vs the parts that
 * expire, for explaining a relocation target. `permanentPct` is strategic +
 * specialization; `temporaryPct` is the region deposit, gone after `depositEndAt`.
 */
export interface BonusBreakdown {
  totalPct: number
  permanentPct: number
  temporaryPct: number
  depositEndAt?: string
}

function bonusBreakdown(info: ItemBonusInfo | undefined): BonusBreakdown {
  if (!info) {
    return { totalPct: 0, permanentPct: 0, temporaryPct: 0 }
  }

  return {
    totalPct: info.bonusPct,
    permanentPct: info.strategicPct + info.ethicSpecializationPct,
    temporaryPct: info.depositPct + info.ethicDepositPct,
    depositEndAt: info.depositEndAt,
  }
}

/**
 * The single most profitable item to produce anywhere right now: the item whose
 * best region maximises net gold per base production point.
 */
export interface Frontier {
  itemCode: string
  regionName: string
  bonusPct: number
  netPerBasePoint: number
}

/**
 * The per-factory data the model needs. `pointsPerDay` is the smoothed
 * `work.getStatsByCompany` total (post-bonus production points); `bonusPct` is
 * the factory's current production bonus, used to recover the bonus-free base
 * capacity; `grossWagePerDay` is the gold the owner pays employees (the owner
 * bears the gross wage, the wage tax is the employee's).
 */
export interface FactoryInput {
  id: string
  name: string
  itemCode: string
  regionName: string
  bonusPct: number
  workerCount: number
  pointsPerDay: number
  grossWagePerDay: number
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
  bonusPct: number
  workerCount: number
  // Production points/day (post-bonus, = the work-stats total). Summed into the
  // entity PP aggregates; units = pointsPerDay / productionPoints.
  pointsPerDay: number
  unitsPerDay: number
  sellPrice: number
  revenuePerDay: number
  inputs: InputCost[]
  inputCostPerDay: number
  grossWagePerDay: number
  netPerDay: number
  isIdle: boolean
  // Move potential: keep the same item, relocate to its best region. Net this
  // factory's base capacity would earn there, the gain over now, and the bonus
  // split (permanent vs temporary) at that region.
  moveRegionName: string
  movePotentialNetPerDay: number
  moveOpportunityPerDay: number
  moveBonus: BonusBreakdown
  // Best potential: the globally most profitable item at its best region. Net
  // this factory's base capacity would earn there, and the gain over now.
  // Implies relocating and switching item. Always ≥ move potential.
  bestProductCode: string
  bestRegionName: string
  bestPotentialNetPerDay: number
  bestOpportunityPerDay: number
  topBonus: BonusBreakdown
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
  movePotentialNetPerDay: number
  bestPotentialNetPerDay: number
  moveOpportunityPerDay: number
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
 * Builds the global production frontier: across every producible item, the one
 * whose best region maximises net gold per BASE production point. Output scales
 * with the bonus, so `(1 + bestBonus) × netPerUnit ÷ productionPoints` is what a
 * unit of bonus-free capacity earns making that item at its best location.
 */
export function buildFrontier(prices: ItemPrices, recipe: RecipeLookup, itemBonus: Record<string, ItemBonusInfo>): Frontier | null {
  let best: Frontier | null = null

  for (const code of Object.keys(recipe)) {
    const unit = netPerUnit(code, prices, recipe)
    const info = itemBonus[code]
    const productionPoints = recipe[code].productionPoints
    if (unit == null || !info || productionPoints <= 0) {
      continue
    }

    const netPerBasePoint = (1 + info.bonusPct / 100) * unit / productionPoints
    if (!best || netPerBasePoint > best.netPerBasePoint) {
      best = { itemCode: code, regionName: info.regionName, bonusPct: info.bonusPct, netPerBasePoint }
    }
  }

  return best
}

/**
 * Computes one factory's daily economics, plus two relocation potentials, all
 * applied to the factory's bonus-free base capacity:
 *  - move:  keep the same item, relocate to its best region (`itemBonus[item]`).
 *  - best:  switch to the globally most profitable item (`frontier`).
 * Compute `itemBonus` + `frontier` once and pass them in.
 */
export function computeFactoryProfit(
  input: FactoryInput,
  prices: ItemPrices,
  recipe: RecipeLookup,
  itemBonus: Record<string, ItemBonusInfo>,
  frontier: Frontier | null,
): FactoryProfit {
  const r = recipe[input.itemCode]
  const productionPoints = r?.productionPoints ?? 1
  const unitsPerDay = input.pointsPerDay / productionPoints
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

  const netPerDay = revenuePerDay - inputCostPerDay - input.grossWagePerDay

  // Bonus-free capacity: production points scale with (1 + bonus), so strip the
  // current bonus to compare locations fairly.
  const basePoints = input.pointsPerDay / (1 + input.bonusPct / 100)

  // Move: same item at its best region (best-region bonus for this item).
  const currentBest = itemBonus[input.itemCode]
  const currentUnitNet = netPerUnit(input.itemCode, prices, recipe) ?? 0
  const moveRate = (1 + (currentBest?.bonusPct ?? input.bonusPct) / 100) * currentUnitNet / productionPoints
  const movePotentialNetPerDay = input.pointsPerDay <= 0 ? 0 : basePoints * moveRate - input.grossWagePerDay
  const moveOpportunityPerDay = Math.max(0, movePotentialNetPerDay - netPerDay)

  // Best: globally most profitable item at its best region.
  const bestPotentialNetPerDay = input.pointsPerDay <= 0 || !frontier
    ? (frontier ? 0 : netPerDay)
    : basePoints * frontier.netPerBasePoint - input.grossWagePerDay
  const bestOpportunityPerDay = Math.max(0, bestPotentialNetPerDay - netPerDay)

  return {
    id: input.id,
    name: input.name,
    regionName: input.regionName,
    itemCode: input.itemCode,
    bonusPct: input.bonusPct,
    workerCount: input.workerCount,
    pointsPerDay: input.pointsPerDay,
    unitsPerDay,
    sellPrice,
    revenuePerDay,
    inputs,
    inputCostPerDay,
    grossWagePerDay: input.grossWagePerDay,
    netPerDay,
    isIdle: input.pointsPerDay <= 0,
    moveRegionName: currentBest?.regionName ?? input.regionName,
    movePotentialNetPerDay,
    moveOpportunityPerDay,
    moveBonus: bonusBreakdown(currentBest),
    bestProductCode: frontier?.itemCode ?? input.itemCode,
    bestRegionName: frontier?.regionName ?? input.regionName,
    bestPotentialNetPerDay,
    bestOpportunityPerDay,
    topBonus: bonusBreakdown(frontier ? itemBonus[frontier.itemCode] : undefined),
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
  movePotentialNetPerDay: number
  topPotentialNetPerDay: number
}

/**
 * Sums one user's computed factories into the per-user aggregate the scrape
 * persists.
 */
export function aggregateUserFactories(rows: FactoryProfit[]): UserFactoryAgg {
  const agg: UserFactoryAgg = { factoryCount: 0, ppPerDay: 0, netPerDay: 0, movePotentialNetPerDay: 0, topPotentialNetPerDay: 0 }

  for (const row of rows) {
    agg.factoryCount += 1
    agg.ppPerDay += row.pointsPerDay
    agg.netPerDay += row.netPerDay
    agg.movePotentialNetPerDay += row.movePotentialNetPerDay
    agg.topPotentialNetPerDay += row.bestPotentialNetPerDay
  }

  return agg
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
    movePotentialNetPerDay: 0,
    bestPotentialNetPerDay: 0,
    moveOpportunityPerDay: 0,
    bestOpportunityPerDay: 0,
  }

  for (const row of rows) {
    if (!row.isIdle) {
      totals.activeCount += 1
    }
    totals.revenuePerDay += row.revenuePerDay
    totals.costPerDay += row.inputCostPerDay + row.grossWagePerDay
    totals.netPerDay += row.netPerDay
    totals.movePotentialNetPerDay += row.movePotentialNetPerDay
    totals.bestPotentialNetPerDay += row.bestPotentialNetPerDay
    totals.moveOpportunityPerDay += row.moveOpportunityPerDay
    totals.bestOpportunityPerDay += row.bestOpportunityPerDay
  }

  return totals
}
