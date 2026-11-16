import type { EmployeeLike } from '../model'
import type { AdvisorCompany, AdvisorInput, Fact, TodoItem } from '../types'

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

  /**
   * Gold an hour per tool percent: a percent of base output, worth nothing on goods the tool doesn't fit.
   */
  value: number

  tool: Tool | null
}

interface Tool {
  code: string

  /**
   * The rolled bonus, whether or not it works on its holder's item.
   */
  pct: number

  /**
   * Who holds it today, so moves name each tool by them.
   */
  owner: Holder
}

/**
 * One tool going from today's holder to where it ends up.
 */
interface Leg {
  tool: Tool
  from: Holder
  to: Holder
  gainPerDay: number
}

function heldPct(e: EmployeeLike): number {
  return e.toolItem && !e.toolStatus?.isBroken ? e.toolStatus?.rolledPercent ?? 0 : 0
}

function legText(leg: Leg): string {
  const { from, to, tool } = leg

  return `${firstName(from.e.name)}'s ${toolLabel(tool.code)} (+${tool.pct}%) to ${firstName(to.e.name)}`
}

/**
 * A single move names both companies; a chain names only the people, to stay readable.
 */
function legsTitle(legs: Leg[]): Pick<TodoItem, 'title' | 'titleParts'> {
  if (legs.length > 1) {
    return { title: `Give ${legs.map(legText).join(', and ')}` }
  }

  const [{ from, to }] = legs
  const lead = `Give ${legText(legs[0])} at `
  if (from.c.id === to.c.id) {
    return titleAt(lead, to.c)
  }

  return {
    title: `${lead}${to.c.name}, from ${from.c.name}`,
    titleParts: [lead, companyRef(to.c), ', from ', companyRef(from.c)],
  }
}

function worth(h: Holder): string {
  return fmt(h.value * 100, 3)
}

function legFact(leg: Leg): Fact {
  return { label: legText(leg), value: `${leg.gainPerDay >= 0 ? '+' : ''}${fmt(leg.gainPerDay)} g/day` }
}

/**
 * Greedy pairwise swaps find where each tool earns most: a stronger tool belongs
 * where a percent of base output is worth the most gold, across companies and
 * goods the tool fits.
 *
 * Each row is one tool's trip from today's holder to its final one, so rows can
 * be done in any order. A tool that only moves to make room joins the row of the
 * tool that displaces it, which keeps every row's net gain positive.
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
      const holder: Holder = { e, c, value: fits ? basePerHour(e) * vpp / 100 : 0, tool: null }
      holder.tool = code ? { code, pct, owner: holder } : null
      byKind.set(kind, [...byKind.get(kind) ?? [], holder])
    }
  }

  const items: TodoItem[] = []
  for (const staff of byKind.values()) {
    const pctOf = (h: Holder) => h.tool?.pct ?? 0

    for (let round = 0; round < staff.length; round++) {
      let best: { a: number, b: number, gain: number } | null = null
      for (let a = 0; a < staff.length; a++) {
        for (let b = 0; b < staff.length; b++) {
          const pctDrop = pctOf(staff[a]) - pctOf(staff[b])
          const gain = (staff[b].value - staff[a].value) * pctDrop
          if (pctDrop > 0 && gain > 0 && (!best || gain > best.gain)) {
            best = { a, b, gain }
          }
        }
      }

      if (!best || HOURS_PER_DAY * best.gain < MIN_GAIN_PER_DAY) {
        break
      }

      const held = staff[best.a].tool
      staff[best.a].tool = staff[best.b].tool
      staff[best.b].tool = held
    }

    // Holders linked by a moved tool share a row.
    const group = staff.map((_, i) => i)
    const root = (i: number): number => (group[i] === i ? i : (group[i] = root(group[i])))
    const legs: Leg[] = []
    staff.forEach((to, i) => {
      const tool = to.tool
      if (!tool || tool.owner === to) {
        return
      }

      const from = tool.owner
      legs.push({ tool, from, to, gainPerDay: HOURS_PER_DAY * tool.pct * (to.value - from.value) })
      group[root(i)] = root(staff.indexOf(from))
    })

    const rows = new Map<number, Leg[]>()
    for (const leg of legs) {
      const key = root(staff.indexOf(leg.to))
      rows.set(key, [...rows.get(key) ?? [], leg])
    }

    for (const row of rows.values()) {
      row.sort((a, b) => b.gainPerDay - a.gainPerDay)
      const main = row[0]
      const [toName, fromName] = [firstName(main.to.e.name), firstName(main.from.e.name)]
      const why = main.from.value > 0
        ? `${toName}'s base output is worth ${worth(main.to)} gold an hour against ${worth(main.from)} for ${fromName},`
        + ' and a tool adds a percent of base output.'
        : `${fromName} can't use a ${toolKind(main.tool.code)} at ${main.from.c.name};`
          + ` ${toName}'s base output is worth ${worth(main.to)} gold an hour.`

      items.push({
        id: `tool-${row.map(l => `${l.from.e._id}-${l.to.e._id}`).join('-')}`,
        kind: 'tool',
        ...legsTitle(row),
        why: row.length > 1 ? `${why} The rest only makes room for it, so the gain is net.` : why,
        facts: row.length > 1
          ? row.map(legFact)
          : [
              {
                label: `${toName}'s base`,
                value: `${worth(main.to)} g/h`,
                brief: `${toName} ${worth(main.to)} vs ${worth(main.from)} g/h base`,
              },
              { label: `${fromName}'s base`, value: `${worth(main.from)} g/h` },
            ],
        gainPerDay: row.reduce((s, l) => s + l.gainPerDay, 0),
      })
    }
  }

  return items
}
