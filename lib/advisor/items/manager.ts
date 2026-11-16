import type { AdvisorCompany, AdvisorInput, TodoItem } from '../types'

import {
  basePerHour,
  effectiveManagerPct,
  HOURS_PER_DAY,
  managerNetPerDay,
  RULES,
} from '../model'
import { fmt, MIN_GAIN_PER_DAY } from '../shared'

/**
 * Fire a manager whose bonus is worth less than their wage, or post a job where a
 * market-rate manager pays.
 */
export function managerItems(input: AdvisorInput, c: AdvisorCompany, vpp: number): TodoItem[] {
  const working = c.employees.filter(e => !e.companyDisabled)
  const baseSum = working.reduce((s, e) => s + basePerHour(e), 0)
  const ownerPct = working[0]?.productionBonus?.contributions?.find(x => x.source === 'management')?.percent ?? 0

  if (c.manager) {
    const m = c.manager
    const net = managerNetPerDay({
      basePerHourSum: baseSum,
      managerPct: m.productionBonusPercent,
      ownerPct,
      hourlyWage: m.hourlyWage,
      valuePerPoint: vpp,
    })

    const counted = effectiveManagerPct(m.productionBonusPercent, ownerPct)
    if (net < -MIN_GAIN_PER_DAY) {
      return [{
        id: `fire-manager-${c.id}`,
        kind: 'manager',
        title: `Fire the manager at ${c.name}`,
        why: `Their +${counted}% adds ${fmt(net + HOURS_PER_DAY * m.hourlyWage)} a day of output for ${fmt(HOURS_PER_DAY * m.hourlyWage)} in wages. Leaves out their daily +5 happiness care.`,
        gainPerDay: -net,
        energy: 0,
      }]
    }

    return []
  }

  if (!working.length || input.managerMarketWage == null) {
    return []
  }

  const pct = effectiveManagerPct(RULES.managerCapPct, ownerPct)
  const net = managerNetPerDay({
    basePerHourSum: baseSum,
    managerPct: pct,
    ownerPct,
    hourlyWage: input.managerMarketWage,
    valuePerPoint: vpp,
  })

  if (net < MIN_GAIN_PER_DAY) {
    return []
  }

  return [{
    id: `hire-manager-${c.id}`,
    kind: 'manager',
    title: `Post a manager job at ${c.name}`,
    why: `A manager with ${pct / RULES.managementPctPerPoint} Management adds +${pct}% here. At the market's ${fmt(input.managerMarketWage, 3)} an hour that nets this much a day.`,
    gainPerDay: net,
    energy: 0,
  }]
}
