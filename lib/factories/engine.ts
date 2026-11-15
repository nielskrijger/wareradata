import type { GameConfig } from '@/lib/warera/api'

/**
 * Automated-engine production model. A factory produces from two sources: its
 * automated engine and its NPC employees. The employees' output and wages come
 * straight from the API (`employee.getCompanyEstimate`, which already
 * folds in every employee's production bonus), but that estimate leaves the
 * engine out, so the engine's share is derived here from the static game config.
 *
 * Self-work (the owner's own clicks) is NOT modelled: the owner spreads a finite
 * energy budget by hand across all their factories, so it can't be pinned to any
 * one.
 */
export interface EngineModel {
  /**
   * Automated-engine production points/day by engine level, from
   * gameConfig.upgradesConfig.automatedEngine. Missing level ⇒ no engine.
   */
  dailyProdByLevel: Record<number, number>
}

/**
 * Builds the {@link EngineModel} from the live game config, so a rebalance of
 * engine output flows through without a code change.
 */
export function buildEngineModel(gameConfig: GameConfig): EngineModel {
  const dailyProdByLevel: Record<number, number> = {}
  for (const [level, cfg] of Object.entries(gameConfig.upgradesConfig.automatedEngine.levels)) {
    dailyProdByLevel[Number(level)] = cfg.stats.dailyProd
  }
  return { dailyProdByLevel }
}

/**
 * The automated engine's production points/day at `level`, scaled by the
 * company's `engineMultiplier` (from the hourly estimate; 1 when unknown). Runs
 * every day on its own, no clicking required.
 */
export function enginePointsPerDay(level: number, model: EngineModel, multiplier = 1): number {
  return (model.dailyProdByLevel[level] ?? 0) * multiplier
}
