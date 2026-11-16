import type { AdvisorCompany, AdvisorInput, TodoItem } from '../types'

import {
  basePerHour,
  effectiveManagerPct,
  HOURS_PER_DAY,
  managerNetPerDay,
  RULES,
} from '../model'
import { companyRef, fmt, MIN_GAIN_PER_DAY } from '../shared'

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
    const output = fmt(net + HOURS_PER_DAY * m.hourlyWage)
    const wages = fmt(HOURS_PER_DAY * m.hourlyWage)
    if (net < -MIN_GAIN_PER_DAY) {
      return [{
        id: `fire-manager-${c.id}`,
        kind: 'manager',
        title: `Fire the manager at ${c.name}`,
        titleParts: ['Fire the manager at ', companyRef(c)],
        why: `Their +${counted}% adds ${output} gold of output a day but costs ${wages} in wages. Their daily +5 happiness isn't counted.`,
        facts: [
          { label: 'Output', value: `+${counted}% · ${output} g/day`, brief: `adds ${output} g/day` },
          { label: 'Wages', value: `${wages} g/day`, brief: `costs ${wages}` },
          { label: 'Not counted', value: '+5 happiness a day' },
        ],
        gainPerDay: -net,
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

  const points = pct / RULES.managementPctPerPoint
  const wage = fmt(input.managerMarketWage, 3)

  return [{
    id: `hire-manager-${c.id}`,
    kind: 'manager',
    title: `Post a manager job at ${c.name}`,
    titleParts: ['Post a manager job at ', companyRef(c)],
    why: `A manager with ${points} Management adds ${pct}% output, for the market wage of ${wage} gold an hour.`,
    facts: [
      { label: 'Management', value: `${points}`, brief: `${points} Management` },
      { label: 'Output', value: `+${pct}%`, brief: `+${pct}% output` },
      { label: 'Market wage', value: `${wage} g/h`, brief: `${wage} g/h` },
    ],
    gainPerDay: net,
    group: { key: 'manager-job', short: c.name, company: companyRef(c) },
  }]
}
