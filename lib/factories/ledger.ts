import type { FactoryProfit } from './profit'
import type { FactoryData, WorkerInfo } from '@/lib/warera/api'

import { avgCompleteStat } from './inputs'

// Worker loyalty caps at +10% production (gameConfig.worker.maxFidelity).
const MAX_FIDELITY = 10

// Skill baselines for a worker not in our user set: the level-0 values
// (skills.production lvl0 = 10, skills.energy lvl0 = 30).
const DEFAULT_PRODUCTION = 10
const DEFAULT_ENERGY = 30

/**
 * A worker's trained skills, used to weight their share of factory output.
 */
export interface WorkerSkill {
  production: number
  energy: number
}

/**
 * One worker's net benefit to the factory per day: their output (net of input
 * cost) minus their wage. The factory's realized production and wage are split
 * across its workers by capacity (production skill × energy), with revenue also
 * scaled by fidelity and wage left on the un-boosted base — so a worker's net
 * plus the engine's net sum to the factory's Net, and higher fidelity reads as
 * higher net (the loyalty bonus is effectively un-waged production).
 */
export interface LedgerWorker {
  id: string
  name: string
  fidelity: number
  // The breakdown behind netPerDay: revenue − inputCost − wage = net.
  revenuePerDay: number
  inputCostPerDay: number
  wagePerDay: number
  // The worker's contracted wage rate (gold per work), shown next to the
  // apportioned daily wage.
  wageRate: number
  netPerDay: number
}

/**
 * A {@link FactoryProfit} enriched for the user-page ledger: the net projected at
 * full worker loyalty, the automated engine's net contribution, and a per-worker
 * net breakdown. Net and potentials already exclude self-work (the `pointsPerDay`
 * fed into the profit model is engine + workers only).
 */
export interface FactoryLedgerRow extends FactoryProfit {
  projectedNetPerDay: number
  engineLevel: number
  engineNetPerDay: number
  workers: LedgerWorker[]
}

/**
 * Splits a factory's realized production into its ledger lines and projects net
 * to full worker loyalty. `profit.pointsPerDay` is the engine + employee total
 * (self-work already excluded). Each worker is weighted by their capacity
 * (production skill × energy via `skillOf`): revenue/inputs scale with fidelity
 * (their share of total output), wage scales with the un-boosted base capacity
 * (the fidelity bonus is un-waged) — which is why a higher-fidelity worker nets
 * more. The splits are normalized to the realized totals, so the per-worker nets
 * plus the engine's net always sum to the factory's Net. The full-loyalty net
 * raises every worker's fidelity to the +10% cap; engine and wage are unchanged.
 */
export function buildFactoryLedgerRow(
  profit: FactoryProfit,
  stats: FactoryData['stats'],
  workers: WorkerInfo[],
  engineLevel: number,
  productionPoints: number,
  nameOf: (userId: string) => string,
  skillOf: (userId: string) => WorkerSkill | null,
): FactoryLedgerRow {
  const pp = productionPoints || 1
  const effPts = profit.pointsPerDay
  const enginePts = avgCompleteStat(stats, 'automatedEngine')
  const empProd = avgCompleteStat(stats, 'employeeProd')

  // Gold earned per production point, net of input cost, recovered from the
  // already computed net: net = (effPts / pp) × unitNet − wages.
  const unitNet = effPts > 0 ? (profit.netPerDay + profit.grossWagePerDay) * pp / effPts : 0
  const netOf = (pts: number) => (pts / pp) * unitNet
  const grossOf = (pts: number) => (pts / pp) * profit.sellPrice

  // Per-worker weights: base capacity = production skill × energy. Revenue/inputs
  // track total output (× fidelity); wage tracks the un-boosted base × wage rate.
  const weighted = workers.map((w) => {
    const skill = skillOf(w.userId)
    const baseCapacity = (skill?.production ?? DEFAULT_PRODUCTION) * (skill?.energy ?? DEFAULT_ENERGY)
    return { w, baseCapacity, revWeight: baseCapacity * (1 + w.fidelity / 100), wageWeight: baseCapacity * w.wage }
  })
  const revWeightSum = weighted.reduce((sum, x) => sum + x.revWeight, 0) || 1
  const wageWeightSum = weighted.reduce((sum, x) => sum + x.wageWeight, 0) || 1
  const baseCapacitySum = weighted.reduce((sum, x) => sum + x.baseCapacity, 0)

  const empGross = grossOf(empProd)
  const empInput = empGross - netOf(empProd)
  const ledgerWorkers: LedgerWorker[] = weighted.map(({ w, revWeight, wageWeight }) => {
    const revenuePerDay = empGross * revWeight / revWeightSum
    const inputCostPerDay = empInput * revWeight / revWeightSum
    const wagePerDay = profit.grossWagePerDay * wageWeight / wageWeightSum
    return {
      id: w.userId,
      name: nameOf(w.userId),
      fidelity: w.fidelity,
      revenuePerDay,
      inputCostPerDay,
      wagePerDay,
      wageRate: w.wage,
      netPerDay: revenuePerDay - inputCostPerDay - wagePerDay,
    }
  })

  // Full loyalty: every worker's base capacity earns at the +10% cap instead of
  // their current fidelity. Wage is unchanged (the bonus is un-waged).
  const projectedEmpProd = workers.length ? empProd * (1 + MAX_FIDELITY / 100) * baseCapacitySum / revWeightSum : empProd
  const projectedNetPerDay = profit.netPerDay + netOf(projectedEmpProd - empProd)

  return {
    ...profit,
    projectedNetPerDay,
    engineLevel,
    engineNetPerDay: netOf(enginePts),
    workers: ledgerWorkers,
  }
}
