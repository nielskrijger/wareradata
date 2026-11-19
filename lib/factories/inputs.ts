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
 * Whether the game has switched the factory off: nothing produces, not even the engine.
 */
export function isFactoryDisabled(f: FactoryData): boolean {
  return f.company.disabledAt != null
}

/**
 * One factory as model input: engine output from its level, employee output
 * and wages from the hourly estimate × 24. No estimate means no employees.
 *
 * The hourly estimate already reads 0 for a disabled factory, but the engine
 * multiplier doesn't.
 */
export function factoryInputFromData(
  f: FactoryData,
  regionName: (id: string) => string,
  model: EngineModel,
): FactoryInput {
  const h = f.hourly
  const disabled = isFactoryDisabled(f)

  return {
    id: f.company._id,
    name: f.company.name,
    itemCode: f.company.itemCode,
    regionName: regionName(f.company.region),
    employeeCount: f.employees.length,
    employeeCap: h?.cap ?? 0,
    disabled,
    enginePointsPerDay: disabled ? 0 : enginePointsPerDay(engineLevelOf(f), model, h?.engineMultiplier ?? 1),
    employeePointsPerDay: (h?.production ?? 0) * 24,
    wagePerDay: (h?.wageCost ?? 0) * 24,
    managerPerDay: (h?.managerCost ?? 0) * 24,
  }
}
