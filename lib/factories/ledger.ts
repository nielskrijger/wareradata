import type { FactoryProfit } from './profit'
import type { TheoreticalModel, WorkerSkill } from './theoretical'
import type { WorkerInfo } from '@/lib/warera/api'

import { engineTheoreticalPoints, workerProductions } from './theoretical'

/**
 * One worker's theoretical net benefit to the factory per day: the value of the
 * output they'd produce clicking to full energy (net of the inputs it consumes),
 * minus the wage those works cost.
 */
export interface LedgerWorker {
  id: string
  name: string
  // Current loyalty (0–10), shown in the ledger: it lifts this worker's output
  // and so their net.
  fidelity: number
  // The breakdown behind netPerDay: revenue − inputCost − wage = net.
  revenuePerDay: number
  inputCostPerDay: number
  wagePerDay: number
  // The worker's contracted wage rate (gold per work), shown next to the wage.
  wageRate: number
  netPerDay: number
}

/**
 * A {@link FactoryProfit} enriched for the user-page ledger: the automated
 * engine's net contribution and a per-worker net breakdown. Both the factory's
 * net and these lines are theoretical (engine at its level, workers at full daily
 * effort); self-work is excluded.
 */
export interface FactoryLedgerRow extends FactoryProfit {
  engineLevel: number
  engineNetPerDay: number
  workers: LedgerWorker[]
}

/**
 * Splits a factory's theoretical production into its ledger lines: the automated
 * engine plus each hired worker. The same model that produced `profit` is used
 * to recover each source's production points, then the factory's per-point value
 * (revenue net of inputs, recovered from the computed net) is applied — so the
 * engine's net plus the per-worker nets always sum to the factory's Net. Wages
 * come from each worker's theoretical works/day. Self-work is excluded.
 */
export function buildFactoryLedgerRow(
  profit: FactoryProfit,
  workers: WorkerInfo[],
  engineLevel: number,
  productionPoints: number,
  model: TheoreticalModel,
  nameOf: (userId: string) => string,
  skillOf: (userId: string) => WorkerSkill | null,
): FactoryLedgerRow {
  const pp = productionPoints || 1
  const effPts = profit.pointsPerDay

  // Gold earned per production point, net of input cost, recovered from the
  // already computed net: net = (effPts / pp) × unitNet − wages.
  const unitNet = effPts > 0 ? (profit.netPerDay + profit.grossWagePerDay) * pp / effPts : 0
  const netOf = (pts: number) => (pts / pp) * unitNet
  const grossOf = (pts: number) => (pts / pp) * profit.sellPrice

  const enginePts = engineTheoreticalPoints(engineLevel, profit.bonusPct, model)

  const ledgerWorkers: LedgerWorker[] = workerProductions(workers, skillOf, profit.bonusPct, model).map((line) => {
    const revenuePerDay = grossOf(line.productionPerDay)
    const inputCostPerDay = revenuePerDay - netOf(line.productionPerDay)

    return {
      id: line.userId,
      name: nameOf(line.userId),
      fidelity: line.fidelity,
      revenuePerDay,
      inputCostPerDay,
      wagePerDay: line.wagePerDay,
      wageRate: line.wageRate,
      netPerDay: revenuePerDay - inputCostPerDay - line.wagePerDay,
    }
  })

  return {
    ...profit,
    engineLevel,
    engineNetPerDay: netOf(enginePts),
    workers: ledgerWorkers,
  }
}
