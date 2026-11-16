import type { AdvisorCompany, AdvisorInput, TodoItem } from '../types'

import { humanizeCode, humanizeItem } from '@/components/factories/format'

import {
  basePerHour,
  HOURS_PER_DAY,
  RULES,
} from '../model'
import { fmt, specializationPct, toolPct } from '../shared'

/**
 * An item change must pay back its cost within this many days.
 */
const ITEM_PAYBACK_DAYS = 3

/**
 * The best item to switch to, net of lost specialization, when it repays the switch
 * cost in time. Also returns the new item's value so staff are judged on it.
 */
export function itemSwitchItem(
  input: AdvisorInput,
  c: AdvisorCompany,
  vppByItem: Map<string, number>,
): { item: TodoItem, vpp: number } | null {
  const current = vppByItem.get(c.itemCode)
  if (current == null) {
    return null
  }

  const working = c.employees.filter(e => !e.companyDisabled)
  const employeePoints = working.reduce((s, e) => s + HOURS_PER_DAY * (e.estimate?.production ?? 0), 0)
  const pointsNow = c.enginePointsPerDay + employeePoints

  let best: { code: string, gain: number, specFrom: number, specTo: number } | null = null
  for (const [code, vpp] of vppByItem) {
    if (code === c.itemCode || vpp <= current) {
      continue
    }

    let specLoss = 0
    let specFrom = 0
    let specTo = 0
    for (const e of working) {
      const from = specializationPct(e)
      const to = Math.min(e.specializations?.[code] ?? 0, RULES.specializationCapPct)
      specLoss += HOURS_PER_DAY * basePerHour(e) * (from - to) / 100
      specFrom += from
      specTo += to
    }

    const gain = (pointsNow - specLoss) * vpp - pointsNow * current
    if (!best || gain > best.gain) {
      best = { code, gain, specFrom, specTo }
    }
  }

  // Without a concrete price the cost is unknown, so no switch is suggested.
  const cost = input.changeItemConcrete * (input.prices.concrete ?? Number.POSITIVE_INFINITY)
  if (!best || best.gain * ITEM_PAYBACK_DAYS <= cost) {
    return null
  }

  const n = working.length || 1
  const hasTools = working.some(e => toolPct(e) > 0)
  const next = vppByItem.get(best.code) ?? 0
  const specFrom = Math.round(best.specFrom / n)
  const specTo = Math.round(best.specTo / n)
  const why = [
    current > 0
      ? `${humanizeCode(best.code)} pays ${Math.round((next / current - 1) * 100)}% more per production point.`
      : `${humanizeCode(best.code)} pays ${fmt(next, 3)} gold per production point.`,
    `Costs ${input.changeItemConcrete} concrete (${fmt(cost)} gold), earned back in ${Math.ceil(cost / best.gain)} days.`,
    specTo < specFrom ? `Specialization drops from ${specFrom}% to ${specTo}%, already counted.` : '',
    hasTools ? 'Check the tools still fit the new item.' : '',
  ]

  const item: TodoItem = {
    id: `item-${c.id}`,
    kind: 'item',
    // The name already starts with the current item, so only the new one is named.
    title: `Switch ${c.name} to ${humanizeItem(best.code)}`,
    why: why.filter(Boolean).join(' '),
    gainPerDay: best.gain,
    switch: { company: c.ownName, from: c.itemCode, to: best.code },
  }

  return { item, vpp: vppByItem.get(best.code) ?? current }
}
