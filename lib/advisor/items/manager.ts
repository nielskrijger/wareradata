import type { AdvisorCompany, AdvisorInput, SkippedItem, TodoItem } from '../types'

import {
  basePerHour,
  effectiveManagerPct,
  HOURS_PER_DAY,
  managerNetPerDay,
  RULES,
} from '../model'
import { fmt, MIN_GAIN_PER_DAY, titleAt } from '../shared'

/**
 * Fire a manager whose bonus is worth less than their wage, or post a job where a
 * market-rate manager pays, with the most a Management point is worth.
 */
export function managerItems(input: AdvisorInput, c: AdvisorCompany, vpp: number, skipped: SkippedItem[]): TodoItem[] {
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
        ...titleAt('Fire the manager at ', c),
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

  const points = effectiveManagerPct(RULES.managerCapPct, ownerPct) / RULES.managementPctPerPoint
  if (!working.length || !points || input.managerMarketWage == null) {
    return []
  }

  // The market wage buys a manager at the cap, so it divides by the cap's points.
  const marketRate = input.managerMarketWage / (RULES.managerCapPct / RULES.managementPctPerPoint)
  const breakEven = baseSum * (RULES.managementPctPerPoint / 100) * vpp
  const net = HOURS_PER_DAY * points * (breakEven - marketRate)
  const [most, market] = [fmt(breakEven, 4), fmt(marketRate, 4)]
  if (net < MIN_GAIN_PER_DAY) {
    skipped.push({
      title: `Manager at ${c.name}`,
      why: `A Management point adds ${most} gold an hour here, under the market's ${market}.`,
    })

    return []
  }

  return [{
    id: `hire-manager-${c.id}`,
    kind: 'manager',
    ...titleAt('Post a manager job at ', c, `, paying at most ${most} per point`),
    why: `Each Management point adds ${most} gold of output an hour, against ${market} on the market. Up to ${points} points count here.`,
    facts: [
      { label: 'Pay at most', value: `${most} g per point/h`, brief: `at most ${most} per point/h` },
      { label: 'Market', value: `${market} g per point/h` },
      { label: 'Points that count', value: `${points}`, brief: `${points} points` },
    ],
    gainPerDay: net,
  }]
}
