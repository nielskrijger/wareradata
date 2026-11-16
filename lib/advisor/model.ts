import type { Employee } from '@/lib/warera/api'

/**
 * Game rules the API doesn't expose. The output and wage formulas below were
 * checked against `employee.estimate` for every employee on a live account;
 * `scripts/check-advisor.ts` re-checks them.
 */
export const RULES = {
  /**
   * Base output per hour is the Production stat divided by this.
   */
  productionDivisor: 4,
  managementPctPerPoint: 2,

  /**
   * Owner plus manager Management bonus, and the manager's own share.
   */
  combinedManagementCapPct: 44,
  managerCapPct: 22,
  happinessPerResponsibility: 3,

  /**
   * One percent per day on the same item.
   */
  specializationCapPct: 20,
  greedyWageMult: 1.2,
  modestWageMult: 0.85,

  /**
   * The common rarity of each card; rarer hands only make these bigger.
   */
  drillStatGain: 1,
  negotiationDrop: 0.05,

  /**
   * Values beyond this are too uncertain to count (prices, patches).
   */
  horizonDays: 30,
} as const

export const HOURS_PER_DAY = 24

/**
 * The bits of an employee the advisor reads, so checks can build one by hand.
 */
export type EmployeeLike = Pick<
  Employee,
  '_id' | 'name' | 'company' | 'base' | 'wageExpectation' | 'wage' | 'traits' | 'retireInDays'
  | 'potential' | 'trainingsPerDay' | 'trainingsToday' | 'companyDisabled' | 'estimate' | 'breakdown'
  | 'happinessBreakdown' | 'productionBonus' | 'specializations' | 'toolStatus' | 'toolItem'
>

/**
 * Production points per hour before any bonus.
 */
export function basePerHour(e: EmployeeLike): number {
  return (e.breakdown?.production?.total ?? 0) / RULES.productionDivisor
}

/**
 * The additive production bonus as a fraction (0.73 for +73%).
 */
function bonusFraction(e: EmployeeLike): number {
  return (e.productionBonus?.total ?? 0) / 100
}

/**
 * Points per hour as the game computes them: base × (1 + every bonus).
 */
export function outputPerHour(e: EmployeeLike): number {
  return basePerHour(e) * (1 + bonusFraction(e))
}

/**
 * Greedy and Modest scale the wage; nothing else does.
 */
function wageTraitMult(e: EmployeeLike): number {
  let mult = 1
  for (const t of e.traits ?? []) {
    if (t.code === 'greedy') {
      mult *= RULES.greedyWageMult
    }

    if (t.code === 'modest') {
      mult *= RULES.modestWageMult
    }
  }

  return mult
}

/**
 * Hourly wage. Trait Production and every bonus are left out, which is where
 * an employee's profit comes from.
 */
export function wagePerHour(e: EmployeeLike, ppValue: number): number {
  return (e.base.production / RULES.productionDivisor) * ppValue * e.wageExpectation * wageTraitMult(e)
}

/**
 * Gold per day an employee earns the owner at the current value of a point.
 */
export function employeeNetPerDay(e: EmployeeLike, valuePerPoint: number): number {
  return HOURS_PER_DAY * ((e.estimate?.production ?? 0) * valuePerPoint - (e.estimate?.wage ?? e.wage ?? 0))
}

/**
 * Days a gain keeps paying: until retirement, capped at the horizon.
 */
export function payingDays(e: EmployeeLike): number {
  return Math.max(0, Math.min(e.retireInDays ?? 0, RULES.horizonDays))
}

export type CardKind = 'production' | 'negotiation' | 'responsibility'

/**
 * Daily gold change from one common card of each kind.
 */
export function cardGainsPerDay(e: EmployeeLike, valuePerPoint: number, ppValue: number): Record<CardKind, number> {
  const step = RULES.drillStatGain / RULES.productionDivisor
  const mult = wageTraitMult(e)
  const wagePerStatPoint = ppValue * e.wageExpectation * mult
  const production = HOURS_PER_DAY * step * ((1 + bonusFraction(e)) * valuePerPoint - wagePerStatPoint)
  const baseWage = (e.base.production / RULES.productionDivisor) * ppValue * mult
  const negotiation = HOURS_PER_DAY * baseWage * RULES.negotiationDrop

  // Each happiness point is one bonus percent.
  const happinessPct = RULES.drillStatGain * RULES.happinessPerResponsibility
  const responsibility = HOURS_PER_DAY * basePerHour(e) * (happinessPct / 100) * valuePerPoint

  return { production, negotiation, responsibility }
}

/**
 * Whether the game lets the owner train this employee right now.
 */
export function canTrain(e: EmployeeLike): boolean {
  return !e.companyDisabled && (e.potential ?? 0) > 0 && (e.trainingsToday ?? 0) < (e.trainingsPerDay ?? 1)
}

/**
 * The part of a manager's bonus that counts, given the owner's own Management.
 */
export function effectiveManagerPct(managerPct: number, ownerPct: number): number {
  const room = Math.max(0, RULES.combinedManagementCapPct - ownerPct)

  return Math.max(0, Math.min(managerPct, RULES.managerCapPct, room))
}

/**
 * A manager's daily gold: the output their bonus adds minus their wage.
 */
export function managerNetPerDay(opts: {
  basePerHourSum: number
  managerPct: number
  ownerPct: number
  hourlyWage: number
  valuePerPoint: number
}): number {
  const pct = effectiveManagerPct(opts.managerPct, opts.ownerPct)

  return HOURS_PER_DAY * (opts.basePerHourSum * (pct / 100) * opts.valuePerPoint - opts.hourlyWage)
}
