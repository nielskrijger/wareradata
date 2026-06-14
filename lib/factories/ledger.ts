import type { FactoryProfit } from './profit'
import type { FactoryData, WorkerInfo } from '@/lib/warera/api'

import { avgCompleteStat } from './inputs'

// Worker loyalty caps at +10% production (gameConfig.worker.maxFidelity).
const MAX_FIDELITY = 10

/**
 * One worker's net benefit to the factory per day: their output (net of input
 * cost) minus their wage. An estimate — output and wage are split across the
 * factory's workers by their share of production (we don't fetch each worker's
 * skill), so the per-worker net plus the engine's net sum to the factory's Net.
 */
export interface LedgerWorker {
  id: string
  name: string
  fidelity: number
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
 * Splits a factory's production into its ledger lines and projects net to full
 * worker loyalty. `profit.pointsPerDay` is the engine + employee total (self-work
 * already excluded), so the engine and per-worker revenue lines sum to revenue.
 * The full-loyalty net scales each worker's output by (1 + 10%)/(1 + fidelity%);
 * the engine, inputs, and wages are unchanged.
 */
export function buildFactoryLedgerRow(
  profit: FactoryProfit,
  stats: FactoryData['stats'],
  workers: WorkerInfo[],
  engineLevel: number,
  productionPoints: number,
  nameOf: (userId: string) => string,
): FactoryLedgerRow {
  const pp = productionPoints || 1
  const effPts = profit.pointsPerDay
  const enginePts = avgCompleteStat(stats, 'automatedEngine')
  const empProd = avgCompleteStat(stats, 'employeeProd')

  // Gold earned per production point, net of input cost, recovered from the
  // already computed net: net = (effPts / pp) × unitNet − wages.
  const unitNet = effPts > 0 ? (profit.netPerDay + profit.grossWagePerDay) * pp / effPts : 0
  const netOf = (pts: number) => (pts / pp) * unitNet

  // Each worker's output share is weighted by current fidelity; their wage share
  // by output × their own wage rate. Both sets sum back to the factory totals, so
  // each worker's net (output net of inputs, minus wage) plus the engine's net = Net.
  const totalWeight = workers.reduce((sum, w) => sum + (1 + w.fidelity / 100), 0) || 1
  const wageDenom = workers.reduce((sum, w) => sum + (1 + w.fidelity / 100) * w.wage, 0) || 1
  const base = empProd / totalWeight
  const ledgerWorkers: LedgerWorker[] = workers.map((w) => {
    const wagePerDay = profit.grossWagePerDay * ((1 + w.fidelity / 100) * w.wage) / wageDenom
    return {
      id: w.userId,
      name: nameOf(w.userId),
      fidelity: w.fidelity,
      netPerDay: netOf(base * (1 + w.fidelity / 100)) - wagePerDay,
    }
  })

  const factor = workers.length
    ? workers.reduce((sum, w) => sum + (1 + MAX_FIDELITY / 100) / (1 + w.fidelity / 100), 0) / workers.length
    : 1
  const projectedNetPerDay = profit.netPerDay + (empProd * (factor - 1) / pp) * unitNet

  return {
    ...profit,
    projectedNetPerDay,
    engineLevel,
    engineNetPerDay: netOf(enginePts),
    workers: ledgerWorkers,
  }
}
