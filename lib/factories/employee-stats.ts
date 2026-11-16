import type { Employee } from '@/lib/warera/api'

export type StatName = 'production' | 'luck' | 'responsibility'

export const STAT_NAMES: StatName[] = ['production', 'luck', 'responsibility']

/**
 * One stat with where its total comes from: base + trained + contributions.
 */
export interface StatDetail {
  base: number
  trained: number
  total: number
  contributions: { code: string, delta: number, percent: boolean }[]
}

/**
 * A trait with its effect on this employee, read from their breakdowns.
 * `tone` is the sign of that effect; 0 when the breakdowns show none.
 */
export interface TraitDetail {
  code: string

  /**
   * The trait's target as shown: an item, a stat, or a coworker's name.
   */
  arg?: string
  effects: string[]
  tone: -1 | 0 | 1
}

/**
 * The employee fields the roster shows beyond the money ledger.
 */
export interface EmployeeStats {
  age: number
  retireInDays: number
  stats: Record<StatName, StatDetail>
  potential: number
  potentialMax: number
  happiness: number
  happinessReasons: { label: string, delta: number }[]
  bonusSources: { source: string, percent: number }[]
  traits: TraitDetail[]
  tool: { code: string, bonusPct: number, durabilityPct: number } | null

  /**
   * Specialization in the item this factory makes, and the employee's best one.
   */
  specHere: number
  specBest: { itemCode: string, level: number } | null
  wageExpectation: number
}

/**
 * Trainings an employee has left: `potential` counts up to `potentialMax`.
 */
export function potentialLeft(e: { potential: number, potentialMax: number }): number {
  return Math.max(0, e.potentialMax - e.potential)
}

/**
 * A delta with its sign: "+3", "−2", "+40%".
 */
export function signed(value: number, unit = ''): string {
  return `${value > 0 ? '+' : value < 0 ? '−' : ''}${Math.abs(value)}${unit}`
}

/**
 * Collects a trait's effects from the stat, happiness and bonus breakdowns. The
 * API has no trait catalog, so these are the only source of what a trait does.
 */
function traitDetail(e: Employee, code: string, arg: string | undefined, nameById: Map<string, string>): TraitDetail {
  const effects: string[] = []
  let score = 0

  for (const stat of STAT_NAMES) {
    for (const c of e.breakdown?.[stat]?.contributions ?? []) {
      if (c.code === code) {
        effects.push(`${signed(c.delta, c.percent ? '%' : '')} ${stat}`)
        score += c.delta
      }
    }
  }

  for (const c of e.happinessBreakdown?.contributions ?? []) {
    if (c.code === code) {
      effects.push(`${signed(c.delta)} happiness`)
      score += c.delta
    }
  }

  for (const c of e.productionBonus?.contributions ?? []) {
    if (c.source === code) {
      effects.push(`${signed(c.percent, '%')} bonus`)
      score += c.percent
    }
  }

  // Coworker traits point at an employee id; show the name instead.
  const shownArg = arg ? (nameById.get(arg)?.split(' ')[0] ?? (/^[0-9a-f]{24}$/.test(arg) ? undefined : arg)) : undefined

  return { code, arg: shownArg, effects, tone: score > 0 ? 1 : score < 0 ? -1 : 0 }
}

/**
 * Picks the roster's display fields off an API employee. `nameById` resolves
 * coworker ids in trait targets across the owner's factories.
 */
export function employeeStats(e: Employee, nameById: Map<string, string>): EmployeeStats {
  const stats = Object.fromEntries(STAT_NAMES.map((s) => {
    const b = e.breakdown?.[s]

    return [s, {
      base: b?.base ?? 0,
      trained: b?.trained ?? 0,
      total: b?.total ?? 0,
      contributions: (b?.contributions ?? []).map(c => ({ code: c.code, delta: c.delta, percent: !!c.percent })),
    }]
  })) as Record<StatName, StatDetail>

  const specs = Object.entries(e.specializations ?? {}).sort((a, b) => b[1] - a[1])
  const item = e.estimate?.itemCode ?? ''
  const tool = e.toolItem && e.toolStatus ? {
    code: e.toolItem.code,
    bonusPct: e.toolStatus.bonusPercent,
    durabilityPct: e.toolItem.maxState ? (e.toolItem.state / e.toolItem.maxState) * 100 : 0,
  } : null

  return {
    age: e.age,
    retireInDays: e.retireInDays,
    stats,
    potential: e.potential,
    potentialMax: e.potentialMax,
    happiness: e.happinessBreakdown?.value ?? 0,
    happinessReasons: (e.happinessBreakdown?.contributions ?? []).map(c => ({
      label: c.code ?? c.eventCode ?? c.reason,
      delta: c.delta,
    })),
    bonusSources: (e.productionBonus?.contributions ?? []).map(c => ({ source: c.source, percent: c.percent })),
    traits: (e.traits ?? []).map(t => traitDetail(e, t.code, t.arg, nameById)),
    tool,
    specHere: e.specializations?.[item] ?? 0,
    specBest: specs.length ? { itemCode: specs[0][0], level: specs[0][1] } : null,
    wageExpectation: e.wageExpectation,
  }
}
