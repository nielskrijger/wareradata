import type { EmployeeStats } from './employee-stats'
import type { FactoryProfit } from './profit'
import type { Employee } from '@/lib/warera/api'

import { employeeStats } from './employee-stats'

/**
 * One NPC employee's net benefit to the factory per day: the value of the output
 * the API estimates they produce (net of the inputs it consumes), minus their
 * wage.
 */
export interface LedgerEmployee extends EmployeeStats {
  id: string
  name: string
  pointsPerDay: number

  /**
   * The employee's total production bonus (percent), already in their output.
   */
  bonusPct: number

  /**
   * The breakdown behind netPerDay: revenue − inputCost − wage = net.
   */
  revenuePerDay: number
  inputCostPerDay: number
  wagePerDay: number

  /**
   * The employee's wage rate (gold per hour), shown next to the wage.
   */
  wagePerHour: number
  netPerDay: number
}

/**
 * A {@link FactoryProfit} enriched for the user-page ledger: the automated
 * engine's net contribution, a per-employee net breakdown and the manager's
 * wage. Self-work is excluded.
 */
export interface FactoryLedgerRow extends FactoryProfit {
  engineLevel: number
  engineNetPerDay: number
  employees: LedgerEmployee[]
}

/**
 * Splits a factory's production into its ledger lines: the automated engine, each
 * employee, and the manager's wage. The factory's per-point value (revenue net of
 * inputs, recovered from the computed net) is applied to each source's points, so
 * engine + employees − manager always sums to the factory's Net.
 */
export function buildFactoryLedgerRow(
  profit: FactoryProfit,
  employees: Employee[],
  engineLevel: number,
  productionPoints: number,
  nameById: Map<string, string> = new Map(),
): FactoryLedgerRow {
  const pp = productionPoints || 1
  const pts = profit.pointsPerDay

  // Gold per production point, net of input cost, recovered from the computed
  // net: net = (pts / pp) × unitNet − wages − manager.
  const unitNet = pts > 0 ? (profit.netPerDay + profit.wagePerDay + profit.managerPerDay) * pp / pts : 0
  const netOf = (p: number) => (p / pp) * unitNet
  const grossOf = (p: number) => (p / pp) * profit.sellPrice

  const ledgerEmployees: LedgerEmployee[] = employees.map((e) => {
    const pointsPerDay = (e.estimate?.production ?? 0) * 24
    const wagePerHour = e.estimate?.wage ?? e.wage ?? 0
    const wagePerDay = wagePerHour * 24
    const revenuePerDay = grossOf(pointsPerDay)
    const inputCostPerDay = revenuePerDay - netOf(pointsPerDay)

    return {
      ...employeeStats(e, nameById),
      id: e._id,
      name: e.name,
      pointsPerDay,
      bonusPct: e.productionBonus?.total ?? 0,
      revenuePerDay,
      inputCostPerDay,
      wagePerDay,
      wagePerHour,
      netPerDay: revenuePerDay - inputCostPerDay - wagePerDay,
    }
  })

  return {
    ...profit,
    engineLevel,
    engineNetPerDay: netOf(profit.enginePointsPerDay),
    employees: ledgerEmployees.sort((a, b) => b.netPerDay - a.netPerDay),
  }
}
