import type { EmployeeLike } from '../model'
import type { AdvisorCompany, AdvisorInput, TodoItem } from '../types'

import { rarityLabel } from '@/lib/gear/rarity'
import {
  basePerHour,
  HOURS_PER_DAY,
} from '../model'

import { firstName, fmt, MIN_GAIN_PER_DAY, titleAt, toolPct } from '../shared'

function toolLabel(code: string): string {
  const m = /^([a-z]+)(\d)$/i.exec(code)

  return m ? `${rarityLabel(Number(m[2])).toLowerCase()} ${m[1]}` : code
}

interface Holder {
  e: EmployeeLike
  c: AdvisorCompany
  pct: number
  code: string | null
}

/**
 * Greedy pairwise swaps: a stronger tool belongs on the employee with more base output.
 */
export function toolItems(input: AdvisorInput, vppByItem: Map<string, number>): TodoItem[] {
  const byItem = new Map<string, Holder[]>()
  for (const c of input.companies) {
    for (const e of c.employees) {
      if (e.companyDisabled) {
        continue
      }

      const list = byItem.get(c.itemCode) ?? []
      const pct = toolPct(e)
      list.push({ e, c, pct, code: pct > 0 ? e.toolItem?.code ?? null : null })
      byItem.set(c.itemCode, list)
    }
  }

  const items: TodoItem[] = []
  for (const [itemCode, staff] of byItem) {
    const vpp = vppByItem.get(itemCode)
    if (vpp == null) {
      continue
    }

    for (let round = 0; round < staff.length; round++) {
      let best: { a: number, b: number, gain: number } | null = null
      for (let a = 0; a < staff.length; a++) {
        for (let b = 0; b < staff.length; b++) {
          const pctDrop = staff[a].pct - staff[b].pct
          const diff = (basePerHour(staff[b].e) - basePerHour(staff[a].e)) * pctDrop
          if (pctDrop > 0 && diff > 0 && (!best || diff > best.gain)) {
            best = { a, b, gain: diff }
          }
        }
      }

      if (!best || HOURS_PER_DAY * (best.gain / 100) * vpp < MIN_GAIN_PER_DAY) {
        break
      }

      const from = staff[best.a]
      const to = staff[best.b]
      const tool = toolLabel(from.code ?? '')
      const [toName, fromName] = [firstName(to.e.name), firstName(from.e.name)]
      const [toBase, fromBase] = [fmt(basePerHour(to.e)), fmt(basePerHour(from.e))]
      items.push({
        id: `tool-${from.e._id}-${to.e._id}`,
        kind: 'tool',
        ...(to.pct > 0
          ? { title: `Swap tools: ${fromName}'s ${tool} (+${from.pct}%) to ${toName}, theirs back` }
          : titleAt(`Move ${fromName}'s ${tool} (+${from.pct}%) to ${toName} at `, to.c)),
        why: `${toName} makes ${toBase} base points an hour against ${fromBase} for ${fromName}, and a tool adds a percent of base output.`,
        facts: [
          {
            label: `${toName}'s base`,
            value: `${toBase} pts/h`,
            brief: `${toName} ${toBase} vs ${fromBase} base pts/h`,
          },
          { label: `${fromName}'s base`, value: `${fromBase} pts/h` },
        ],
        gainPerDay: HOURS_PER_DAY * (best.gain / 100) * vpp,
        group: {
          key: 'tool-move',
          short: `${firstName(from.e.name)} ${to.pct > 0 ? '⇄' : '→'} ${firstName(to.e.name)}`,
        },
      })

      const pct = from.pct
      const code = from.code
      from.pct = to.pct
      from.code = to.code
      to.pct = pct
      to.code = code
    }
  }

  return items
}
