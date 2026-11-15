import type { EngineModel } from './engine'
import type { FactoryInput, RecipeLookup } from './profit'
import type { FactoryData, GameConfig } from '@/lib/warera/api'

import { enginePointsPerDay } from './engine'
import { buildRecipeLookup } from './profit'

/**
 * Builds the recipe lookup from the game config. gameConfig.items is a fixed
 * struct in the SDK types, not an index signature, so widen it; buildRecipeLookup
 * only reads productionPoints/productionNeeds.
 */
export function recipeFromGameConfig(gameConfig: GameConfig): RecipeLookup {
  // `items` is absent on the empty bootstrap config (cold volume, before the
  // first scrape), which yields an empty lookup.
  return buildRecipeLookup((gameConfig.items ?? {}) as unknown as Record<string, {
    productionPoints?: number
    productionNeeds?: Record<string, number>
  }>)
}

/**
 * A factory's automated-engine level, 0 when it has no engine. Read from
 * `activeUpgradeLevels`: the legacy `upgradesV2` block on older companies is stale.
 */
export function engineLevelOf(f: FactoryData): number {
  return f.company.activeUpgradeLevels?.automatedEngine ?? 0
}

/**
 * Maps one fetched factory into the profit model's input: the engine's daily
 * output from its level, plus the employees' production and the employee and
 * manager wages from the hourly estimate (× 24). A missing estimate counts as no
 * employees. Self-work is excluded.
 */
export function factoryInputFromData(
  f: FactoryData,
  regionName: (id: string) => string,
  model: EngineModel,
): FactoryInput {
  const h = f.hourly

  return {
    id: f.company._id,
    name: f.company.name,
    itemCode: f.company.itemCode,
    regionName: regionName(f.company.region),
    employeeCount: f.employees.length,
    employeeCap: h?.cap ?? 0,
    enginePointsPerDay: enginePointsPerDay(engineLevelOf(f), model, h?.engineMultiplier ?? 1),
    employeePointsPerDay: (h?.production ?? 0) * 24,
    wagePerDay: (h?.wageCost ?? 0) * 24,
    managerPerDay: (h?.managerCost ?? 0) * 24,
  }
}
