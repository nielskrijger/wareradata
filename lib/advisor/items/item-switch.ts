import type { AdvisorCompany, AdvisorInput, Fact, TodoItem } from '../types'

import { humanizeCode, humanizeItem } from '@/components/factories/format'

import {
  basePerHour,
  HOURS_PER_DAY,
  RULES,
  toolFits,
} from '../model'
import { companyRef, fmt, specializationPct, toolPct } from '../shared'

/**
 * An item change must pay back its cost within this many days.
 */
const ITEM_PAYBACK_DAYS = 3

/**
 * An item to switch to, with the staff's summed bonus percents now and after.
 */
interface Candidate {
  code: string
  gain: number
  specFrom: number
  specTo: number
  toolFrom: number
  toolTo: number
}

/**
 * The best item to switch to, net of lost specialization and tool bonus, when it
 * repays the switch cost in time. Also returns the new item's value so staff are judged on it.
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

  let best: Candidate | null = null
  for (const [code, vpp] of vppByItem) {
    if (code === c.itemCode || vpp <= current) {
      continue
    }

    let bonusLoss = 0
    let specFrom = 0
    let specTo = 0
    let toolFrom = 0
    let toolTo = 0
    for (const e of working) {
      const spec = specializationPct(e)
      const specNext = Math.min(e.specializations?.[code] ?? 0, RULES.specializationCapPct)
      const tool = toolPct(e)
      const toolNext = e.toolItem && toolFits(e.toolItem.code, code) ? tool : 0
      bonusLoss += HOURS_PER_DAY * basePerHour(e) * (spec - specNext + tool - toolNext) / 100
      specFrom += spec
      specTo += specNext
      toolFrom += tool
      toolTo += toolNext
    }

    const gain = (pointsNow - bonusLoss) * vpp - pointsNow * current
    if (!best || gain > best.gain) {
      best = { code, gain, specFrom, specTo, toolFrom, toolTo }
    }
  }

  // Without a concrete price the cost is unknown, so no switch is suggested.
  const cost = input.changeItemConcrete * (input.prices.concrete ?? Number.POSITIVE_INFINITY)
  if (!best || best.gain * ITEM_PAYBACK_DAYS <= cost) {
    return null
  }

  const n = working.length || 1
  const next = vppByItem.get(best.code) ?? 0
  const morePct = Math.round((next / current - 1) * 100)
  const days = Math.ceil(cost / best.gain)
  const facts: Fact[] = [
    current > 0
      ? { label: 'Value per point', value: `+${morePct}%`, brief: `+${morePct}% per point` }
      : { label: 'Value per point', value: `${fmt(next, 3)} g`, brief: `${fmt(next, 3)} g per point` },
    {
      label: 'Switch cost',
      value: `${input.changeItemConcrete} = ${fmt(cost)} g`,
      brief: `${input.changeItemConcrete} · ${fmt(cost)} g`,
      icon: 'concrete',
    },
    { label: 'Earned back', value: `${days} days`, brief: `back in ${days} days` },
  ]

  const why = [
    current > 0
      ? `${humanizeCode(best.code)} pays ${morePct}% more per production point.`
      : `${humanizeCode(best.code)} pays ${fmt(next, 3)} gold per production point.`,
    `Costs ${input.changeItemConcrete} concrete (${fmt(cost)} gold), earned back in ${days} days.`,
  ]

  // Bonuses lost on the new item, averaged over the staff.
  const drops = [
    { label: 'Specialization', short: 'spec', from: best.specFrom, to: best.specTo },
    { label: 'Tool bonus', short: 'tools', from: best.toolFrom, to: best.toolTo },
  ]

  for (const d of drops) {
    const [from, to] = [Math.round(d.from / n), Math.round(d.to / n)]
    if (to < from) {
      const drop = `${from}% → ${to}%`
      facts.push({ label: d.label, value: `${drop}, counted`, brief: `${d.short} ${drop}` })
      why.push(`${d.label} drops from ${from}% to ${to}%, already counted.`)
    }
  }

  const item: TodoItem = {
    id: `item-${c.id}`,
    kind: 'item',
    // The name already starts with the current item, so only the new one is named.
    title: `Switch ${c.name} to ${humanizeItem(best.code)}`,
    titleParts: ['Switch ', companyRef(c), ' → ', { item: best.code }],
    why: why.join(' '),
    facts,
    gainPerDay: best.gain,
  }

  return { item, vpp: vppByItem.get(best.code) ?? current }
}
