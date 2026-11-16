import type { GameConfig } from '@/lib/warera/api'

/**
 * The automated engine's production, from the game config.
 *
 * The API's employee estimate already covers the NPC employees but leaves the
 * engine out. Self-work isn't modelled: owners spread it by hand, so it can't
 * be pinned to one factory.
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
