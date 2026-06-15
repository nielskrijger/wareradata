import type { FactoryInput, ItemBonusInfo, RecipeLookup } from './profit'
import type { TheoreticalModel, WorkerSkill } from './theoretical'
import type { FactoryData, GameConfig, ItemBestRegion, WorkerInfo } from '@/lib/warera/api'

import { buildRecipeLookup } from './profit'
import { engineTheoreticalPoints, sumWorkerProduction, workerProductions } from './theoretical'

/**
 * Builds the recipe lookup from the game config. gameConfig.items is a fixed
 * struct in the SDK types, not an index signature, so widen it; buildRecipeLookup
 * only reads productionPoints/productionNeeds.
 */
export function recipeFromGameConfig(gameConfig: GameConfig): RecipeLookup {
  return buildRecipeLookup(gameConfig.items as unknown as Record<string, { productionPoints?: number, productionNeeds?: Record<string, number> }>)
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
 * A factory's automated-engine level, 0 when it has no engine.
 */
export function engineLevelOf(f: FactoryData): number {
  return f.company.activeUpgradeLevels?.automatedEngine ?? 0
}

/**
 * Maps one fetched factory into the profit model's input, using theoretical
 * production: the automated engine's fixed daily output plus every hired worker
 * clicking to full energy each day. `skillOf` resolves a worker's skills (null ⇒
 * the level-0 defaults for someone outside our user set); `model` carries the
 * static engine/energy/loyalty constants. Self-work is excluded.
 */
export function factoryInputFromData(
  f: FactoryData,
  workers: WorkerInfo[],
  skillOf: (userId: string) => WorkerSkill | null,
  regionName: (id: string) => string,
  model: TheoreticalModel,
): FactoryInput {
  const bonusPct = f.bonus?.total ?? 0
  const enginePoints = engineTheoreticalPoints(engineLevelOf(f), bonusPct, model)
  const { employeePoints, grossWagePerDay } = sumWorkerProduction(workerProductions(workers, skillOf, bonusPct, model))

  return {
    id: f.company._id,
    name: f.company.name,
    itemCode: f.company.itemCode,
    regionName: regionName(f.company.region),
    bonusPct,
    workerCount: workers.length,
    pointsPerDay: enginePoints + employeePoints,
    grossWagePerDay,
  }
}
