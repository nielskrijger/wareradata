import type { EmployeeLike } from '../model'
import type { AdvisorInput, TodoItem } from '../types'

import {
  basePerHour,
  HOURS_PER_DAY,
} from '../model'
import { firstName, fmt, MIN_GAIN_PER_DAY, toolPct } from '../shared'

const TOOL_RARITY = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic']

function toolLabel(code: string): string {
  const m = /^([a-z]+)(\d)$/i.exec(code)

  return m ? `${TOOL_RARITY[Number(m[2]) - 1] ?? ''} ${m[1]}`.trim() : code
}

/**
 * Greedy pairwise swaps: a stronger tool belongs on the employee with more base output.
 */
export function toolItems(input: AdvisorInput, vppByItem: Map<string, number>): TodoItem[] {
  const byItem = new Map<string, { e: EmployeeLike, company: string, pct: number, code: string | null }[]>()
  for (const c of input.companies) {
    for (const e of c.employees) {
      if (e.companyDisabled) {
        continue
      }

      const list = byItem.get(c.itemCode) ?? []
      list.push({ e, company: c.name, pct: toolPct(e), code: toolPct(e) > 0 ? e.toolItem?.code ?? null : null })
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
        title: to.pct > 0
          ? `Swap tools: ${firstName(from.e.name)}'s ${tool} (+${from.pct}%) to ${firstName(to.e.name)}, theirs back`
          : `Move ${firstName(from.e.name)}'s ${tool} (+${from.pct}%) to ${firstName(to.e.name)} (${to.company})`,
        why: `${firstName(to.e.name)} makes ${fmt(basePerHour(to.e))} base points an hour against ${fmt(basePerHour(from.e))} for ${firstName(from.e.name)}, and a tool adds a percent of base output.`,
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
