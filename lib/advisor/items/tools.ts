import type { EmployeeLike } from '../model'
import type { AdvisorCompany, AdvisorInput, TodoItem } from '../types'

import { rarityLabel } from '@/lib/gear/rarity'
import {
  basePerHour,
  HOURS_PER_DAY,
  toolFits,
  toolKind,
  toolKindFor,
} from '../model'

import { companyRef, firstName, fmt, MIN_GAIN_PER_DAY, titleAt } from '../shared'

function toolLabel(code: string): string {
  const m = /^([a-z]+)(\d)$/i.exec(code)

  return m ? `${rarityLabel(Number(m[2])).toLowerCase()} ${m[1]}` : code
}

interface Holder {
  e: EmployeeLike
  c: AdvisorCompany
  code: string | null

  /**
   * The tool's rolled bonus, whether or not it works on this employee's item.
   */
  pct: number

  /**
   * Gold an hour per tool percent: a percent of base output, worth nothing on goods the tool doesn't fit.
   */
  value: number
}

function heldPct(e: EmployeeLike): number {
  return e.toolItem && !e.toolStatus?.isBroken ? e.toolStatus?.rolledPercent ?? 0 : 0
}

/**
 * `Move Ana's rare flask (+9%) from Oil 1 to Bo at Paper 4`, naming the giver's
 * company only when it differs.
 */
function moveTitle(from: Holder, to: Holder, tool: string): Pick<TodoItem, 'title' | 'titleParts'> {
  const [fromName, toName] = [firstName(from.e.name), firstName(to.e.name)]
  if (to.pct > 0) {
    return { title: `Swap tools: ${fromName}'s ${tool} (+${from.pct}%) to ${toName}, theirs back` }
  }

  const lead = `Move ${fromName}'s ${tool} (+${from.pct}%)`
  if (from.c.id === to.c.id) {
    return titleAt(`${lead} to ${toName} at `, to.c)
  }

  const between = ` to ${toName} at `

  return {
    title: `${lead} from ${from.c.name}${between}${to.c.name}`,
    titleParts: [`${lead} from `, companyRef(from.c), between, companyRef(to.c)],
  }
}

/**
 * Greedy pairwise swaps: a stronger tool belongs where a percent of base output
 * is worth the most gold. Tools move across companies and goods, as long as the
 * tool fits the new item.
 */
export function toolItems(input: AdvisorInput, vppByItem: Map<string, number>): TodoItem[] {
  const byKind = new Map<string, Holder[]>()
  for (const c of input.companies) {
    const vpp = vppByItem.get(c.itemCode)
    for (const e of c.employees) {
      const pct = heldPct(e)
      const code = pct > 0 ? e.toolItem?.code ?? null : null
      const kind = code ? toolKind(code) : toolKindFor(c.itemCode)
      if (e.companyDisabled || vpp == null || !kind) {
        continue
      }

      const fits = code ? toolFits(code, c.itemCode) : true
      const list = byKind.get(kind) ?? []
      list.push({ e, c, code, pct, value: fits ? basePerHour(e) * vpp / 100 : 0 })
      byKind.set(kind, list)
    }
  }

  const items: TodoItem[] = []
  for (const staff of byKind.values()) {
    for (let round = 0; round < staff.length; round++) {
      let best: { a: number, b: number, gain: number } | null = null
      for (let a = 0; a < staff.length; a++) {
        for (let b = 0; b < staff.length; b++) {
          const pctDrop = staff[a].pct - staff[b].pct
          const gain = (staff[b].value - staff[a].value) * pctDrop
          if (pctDrop > 0 && gain > 0 && (!best || gain > best.gain)) {
            best = { a, b, gain }
          }
        }
      }

      if (!best || HOURS_PER_DAY * best.gain < MIN_GAIN_PER_DAY) {
        break
      }

      const from = staff[best.a]
      const to = staff[best.b]
      const tool = toolLabel(from.code ?? '')
      const [toName, fromName] = [firstName(to.e.name), firstName(from.e.name)]
      const [toWorth, fromWorth] = [fmt(to.value * 100, 3), fmt(from.value * 100, 3)]
      const why = from.value > 0
        ? `${toName}'s base output is worth ${toWorth} gold an hour against ${fromWorth} for ${fromName},`
        + ' and a tool adds a percent of base output.'
        : `${fromName} can't use a ${toolKind(from.code ?? '')} at ${from.c.name};`
          + ` ${toName}'s base output is worth ${toWorth} gold an hour.`

      items.push({
        id: `tool-${from.e._id}-${to.e._id}`,
        kind: 'tool',
        ...moveTitle(from, to, tool),
        why,
        facts: [
          {
            label: `${toName}'s base`,
            value: `${toWorth} g/h`,
            brief: `${toName} ${toWorth} vs ${fromWorth} g/h base`,
          },
          { label: `${fromName}'s base`, value: `${fromWorth} g/h` },
        ],
        gainPerDay: HOURS_PER_DAY * best.gain,
        group: {
          key: 'tool-move',
          short: `${fromName} ${to.pct > 0 ? '⇄' : '→'} ${toName}`,
        },
      })

      const { pct, code } = from
      from.pct = to.pct
      from.code = to.code
      to.pct = pct
      to.code = code
    }
  }

  return items
}
