import type { GameConfig } from '@/lib/warera/api'

/**
 * Theoretical production model: what a factory WOULD produce at full daily
 * effort, derived from static game rules rather than from scraped history. The
 * automated engine runs itself, so its output is fixed by level and bonus; each
 * hired worker is assumed to click to full energy every day (so their loyalty
 * also sits at the cap). This is the "top possible" production, independent of
 * how active the factory has actually been.
 *
 * Self-work (the owner's own labour) is NOT modelled here: the owner spreads a
 * finite energy budget by hand across all their factories, so it can't be pinned
 * to any one. Net and the potentials are engine + employees only.
 */

/**
 * A worker's two production-relevant skills, as the bonus-free per-day values
 * (`skills.production.value` = points per work, `skills.energy.value` = the
 * energy bar). Stored on each UserRow as productionSkill / energySkill.
 */
export interface WorkerSkill {
  production: number
  energy: number
}

/**
 * Skill values for a worker we don't have in our user set (e.g. a foreign hire):
 * the level-0 baselines (production 10, energy 30).
 */
export const DEFAULT_WORKER_SKILL: WorkerSkill = { production: 10, energy: 30 }

/**
 * The static constants the theoretical model needs, extracted once from
 * `gameConfig` so the per-factory math is plain arithmetic.
 */
export interface TheoreticalModel {
  // Automated-engine base production points/day by engine level (pre-bonus),
  // from gameConfig.upgradesConfig.automatedEngine. Missing level ⇒ no engine.
  engineDailyProd: Record<number, number>
  // Works per day per point of energy: a full day's energy regen ÷ the energy
  // one work costs. A worker who clicks whenever energy allows does
  // `energyValue × worksPerEnergy` works/day.
  worksPerEnergy: number
  // Output multiplier at the loyalty cap, `1 + maxFidelity × bonus%/100`. Daily
  // clicking drives fidelity to this cap, so theoretical output always uses it.
  maxFidelityMult: number
}

/**
 * Builds the {@link TheoreticalModel} from the live game config. Read from the
 * config (never hardcoded) so a rebalance flows through: engine output per level,
 * the energy regen / work-cost ratio, and the loyalty cap all come from there.
 */
export function buildTheoreticalModel(gameConfig: GameConfig): TheoreticalModel {
  const engineDailyProd: Record<number, number> = {}
  for (const [level, cfg] of Object.entries(gameConfig.upgradesConfig.automatedEngine.levels)) {
    engineDailyProd[Number(level)] = cfg.stats.dailyProd
  }

  // hourlyBarRegen = energyValue / regenDividedBy, so a full day regenerates
  // energyValue × 24 / regenDividedBy energy; ÷ the per-work cost gives works.
  const { regenDividedBy, energyCostPerAction } = gameConfig.user
  const worksPerEnergy = 24 / (regenDividedBy * energyCostPerAction)

  const { maxFidelity, fidelityProductionBonusPercent } = gameConfig.worker
  const maxFidelityMult = 1 + (maxFidelity * fidelityProductionBonusPercent) / 100

  return { engineDailyProd, worksPerEnergy, maxFidelityMult }
}

/**
 * The automated engine's theoretical production points/day (post-bonus): the
 * level's base daily output scaled by the factory's production bonus. Runs every
 * day on its own, no clicking required.
 */
export function engineTheoreticalPoints(level: number, bonusPct: number, model: TheoreticalModel): number {
  const base = model.engineDailyProd[level] ?? 0
  return base * (1 + bonusPct / 100)
}

/**
 * A worker's sustainable works/day: their energy bar regenerates fully across
 * the day, and every regenerated point is spent working here.
 */
function worksPerDay(skill: WorkerSkill, model: TheoreticalModel): number {
  return skill.energy * model.worksPerEnergy
}

/**
 * One worker's theoretical contribution to a factory per day: production points
 * (post-bonus, full daily clicks at the loyalty cap) and the wage those works
 * cost. The wage scales with the number of works, not output, so neither the
 * loyalty bonus nor the factory bonus (both pure output multipliers) affects it.
 */
export interface WorkerProduction {
  userId: string
  wageRate: number
  productionPerDay: number
  wagePerDay: number
}

/**
 * Resolves a factory's hired roster into per-worker theoretical production,
 * defaulting a worker we don't know to {@link DEFAULT_WORKER_SKILL}. The single
 * home for the per-worker arithmetic and the default-skill rule, shared by the
 * live page, the scrape, and the ledger. `bonusPct` is the factory's production
 * bonus; `skillOf` resolves a worker's skills (null ⇒ the defaults).
 */
export function workerProductions(
  workers: ReadonlyArray<{ userId: string, wage: number }>,
  skillOf: (userId: string) => WorkerSkill | null,
  bonusPct: number,
  model: TheoreticalModel,
): WorkerProduction[] {
  const bonusMult = 1 + bonusPct / 100
  return workers.map((w) => {
    const skill = skillOf(w.userId) ?? DEFAULT_WORKER_SKILL
    const works = worksPerDay(skill, model)
    return {
      userId: w.userId,
      wageRate: w.wage,
      productionPerDay: skill.production * works * model.maxFidelityMult * bonusMult,
      wagePerDay: w.wage * works,
    }
  })
}

/**
 * Sums a roster's theoretical lines into the factory totals the profit model
 * takes: combined employee production points and the gross wage the owner pays.
 */
export function sumWorkerProduction(lines: WorkerProduction[]): { employeePoints: number, grossWagePerDay: number } {
  let employeePoints = 0
  let grossWagePerDay = 0
  for (const line of lines) {
    employeePoints += line.productionPerDay
    grossWagePerDay += line.wagePerDay
  }
  return { employeePoints, grossWagePerDay }
}
