import type { AdvisorCompany, AdvisorInput, Fact, TodoItem } from '../types'

import { humanizeCode, humanizeItem } from '@/components/factories/format'

import {
  basePerHour,
  HOURS_PER_DAY,
  payingDays,
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
  days: number
  specFrom: number
  specTo: number
  toolFrom: number
  toolTo: number
}

/**
 * The best item to switch to, net of lost specialization and tool bonus, when it
 * repays the switch cost in time. Also returns the new item's value so staff are judged on it.
 *
 * Specialization grows a point a day on either path, so the gain is the average
 * over the horizon and the payback comes from the running total.
 *
 * Retirees are replaced, so their slot keeps producing on either path.
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

  // Without a concrete price the cost is unknown, so no switch is suggested.
  const cost = input.changeItemConcrete * (input.prices.concrete ?? Number.POSITIVE_INFINITY)
  const working = c.employees.filter(e => !e.companyDisabled)
  const cap = RULES.specializationCapPct

  let best: Candidate | null = null
  for (const [code, vpp] of vppByItem) {
    if (code === c.itemCode || vpp <= current) {
      continue
    }

    const staff = working.map((e) => {
      const tool = toolPct(e)

      return {
        days: payingDays(e),
        basePerDay: HOURS_PER_DAY * basePerHour(e),
        pointsPerDay: HOURS_PER_DAY * (e.estimate?.production ?? 0),
        spec: specializationPct(e),
        specNext: Math.min(e.specializations?.[code] ?? 0, cap),
        tool,
        toolNext: e.toolItem && toolFits(e.toolItem.code, code) ? tool : 0,
      }
    })

    // A retiree's replacement starts at the weakest base here, unspecialized on either item.
    const newcomerBase = Math.min(...staff.map(s => s.basePerDay))
    let total = 0
    let days = Number.POSITIVE_INFINITY
    for (let d = 0; d < RULES.horizonDays; d++) {
      let gain = c.enginePointsPerDay * (vpp - current)
      for (const s of staff) {
        if (d < s.days) {
          const stayPct = Math.min(cap, s.spec + d) - s.spec
          const switchPct = Math.min(cap, s.specNext + d) - s.spec + s.toolNext - s.tool
          gain += (s.pointsPerDay + s.basePerDay * switchPct / 100) * vpp
            - (s.pointsPerDay + s.basePerDay * stayPct / 100) * current
        } else {
          const spec = Math.min(cap, d - s.days)
          gain += newcomerBase * ((1 + (spec + s.toolNext) / 100) * vpp - (1 + (spec + s.tool) / 100) * current)
        }
      }

      total += gain
      if (days === Number.POSITIVE_INFINITY && total >= cost) {
        days = d + 1
      }
    }

    const sum = (pick: (s: typeof staff[number]) => number) => staff.reduce((t, s) => t + pick(s), 0)
    const candidate = {
      code,
      gain: total / RULES.horizonDays,
      days,
      specFrom: sum(s => s.spec),
      specTo: sum(s => s.specNext),
      toolFrom: sum(s => s.tool),
      toolTo: sum(s => s.toolNext),
    }

    if (candidate.days <= ITEM_PAYBACK_DAYS && (!best || candidate.gain > best.gain)) {
      best = candidate
    }
  }

  if (!best) {
    return null
  }

  const n = working.length || 1
  const next = vppByItem.get(best.code) ?? 0
  const morePct = Math.round((next / current - 1) * 100)
  const days = best.days
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
    { label: 'Specialization', short: 'spec', from: best.specFrom, to: best.specTo, note: 'regrows 1% a day' },
    { label: 'Tool bonus', short: 'tools', from: best.toolFrom, to: best.toolTo, note: 'counted' },
  ]

  for (const d of drops) {
    const [from, to] = [Math.round(d.from / n), Math.round(d.to / n)]
    if (to < from) {
      const drop = `${from}% → ${to}%`
      facts.push({ label: d.label, value: `${drop}, ${d.note}`, brief: `${d.short} ${drop}` })
      why.push(`${d.label} drops from ${from}% to ${to}%, ${d.note}.`)
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
