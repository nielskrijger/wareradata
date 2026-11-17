import type { Plan, World } from '../sim/world'
import type { AdvisorCompany, AdvisorInput, TodoItem } from '../types'

import { humanizeItem } from '@/components/factories/format'
import { rarityLabel } from '@/lib/gear/rarity'
import { RULES } from '../model'
import { companyRef, firstName, fmt, MIN_GAIN_PER_DAY, signedFmt } from '../shared'
import { clone, companyOf, searchPlan } from '../sim/search'
import { companyDaily } from '../sim/world'

function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? '' : 's'}`
}

function toolLabel(code: string): string {
  const m = /^([a-z]+)(\d)$/i.exec(code)

  return m ? `${rarityLabel(Number(m[2])).toLowerCase()} ${m[1]}` : code
}

/**
 * Gold a change adds to companies `ks`, from plan `before` to plan `after`.
 */
function gainOf(world: World, before: Plan, after: Plan, ks: number[]) {
  const horizon = RULES.horizonDays
  const perCompany = ks.map(k => companyDaily(world, after, k).map((g, d) => g - companyDaily(world, before, k)[d]))
  const daily = perCompany[0].map((_, d) => perCompany.reduce((s, x) => s + x[d], 0))
  let sum = 0
  const back = daily.findIndex(g => (sum += g) >= 0) + 1

  return {
    perDay: daily.reduce((s, g) => s + g, 0) / horizon,
    back: plural(back, 'day'),
    facts: ks.length > 1
      ? ks.map((k, i) => ({
          label: world.companies[k].c.name,
          value: `${signedFmt(perCompany[i].reduce((s, g) => s + g, 0) / horizon)} g/day`,
        }))
      : [],
  }
}

/**
 * Union-find over companies: the groups of `ks` that `links` join.
 */
function groupsOf(n: number, links: number[][]): number[][] {
  const root = Array.from({ length: n }, (_, k) => k)
  const find = (k: number): number => (root[k] === k ? k : (root[k] = find(root[k])))
  links.forEach(ks => ks.forEach(k => root[find(k)] = find(ks[0])))

  const groups = new Map<number, number[]>()
  for (const k of new Set(links.flat())) {
    groups.set(find(k), [...groups.get(find(k)) ?? [], k])
  }

  return [...groups.values()].map(ks => ks.sort((a, b) => a - b))
}

/**
 * The plan for the owner's companies as rows: one for all moves (one trip to
 * Reorganize), one per item switch, and one per group of tool hand-offs.
 *
 * Each kind counts on top of the ones before it (moves, then switches, then
 * tools), so the rows add up to the plan's gain.
 *
 * Returns the plan and the companies as it leaves them, for the advice that
 * builds on the new teams.
 */
export function planItems(input: AdvisorInput, world: World): {
  items: TodoItem[]
  plan: Plan
  companies: AdvisorCompany[]
} {
  const target = searchPlan(world)
  const { today } = world
  const company = (k: number) => world.companies[k].c
  const name = (i: number) => firstName(world.workers[i].e.name)
  const horizon = RULES.horizonDays
  const items: TodoItem[] = []

  // Moves.
  const moved = { ...clone(today), team: target.team }
  const at = companyOf(moved)
  const movers = world.workers.flatMap((w, i) => (at[i] === w.home ? [] : [i]))
  const moveKs = [...new Set(movers.flatMap(i => [world.workers[i].home, at[i]]))].sort((a, b) => a - b)
  const moves = movers.length ? gainOf(world, today, moved, moveKs) : null
  const movesKept = !!moves && moves.perDay >= MIN_GAIN_PER_DAY
  if (moves && movesKept) {
    items.push({
      id: `move-${movers.map(i => world.workers[i].e._id).join('-')}`,
      kind: 'move',
      title: `Move ${plural(movers.length, 'worker')}`,
      why: `Adds ${fmt(moves.perDay * horizon)} gold over ${horizon} days.`
        + ' In Workforce, press Reorganize, drag each worker to the company named, then Apply.',
      facts: [
        { label: 'In the game', value: 'Workforce → Reorganize', brief: 'Workforce → Reorganize' },
        ...moves.facts,
      ],
      gainPerDay: moves.perDay,
      byCompany: moveKs.flatMap((k) => {
        const steps = movers
          .filter(i => world.workers[i].home === k)
          .map(i => `${name(i)} → ${company(at[i]).ownName}`)

        return steps.length ? [{ company: companyRef(company(k)), steps }] : []
      }),
    })
  } else {
    moved.team = today.team.map(t => [...t])
  }

  // Switches, each on top of the moves.
  const switched = clone(moved)
  for (const [k, item] of target.item.entries()) {
    if (item === today.item[k]) {
      continue
    }

    const after = clone(moved)
    after.item[k] = item
    const sw = gainOf(world, moved, after, [k])
    if (sw.perDay < MIN_GAIN_PER_DAY) {
      continue
    }

    switched.item[k] = item
    const c = company(k)
    const [from, to] = [world.vpp.get(today.item[k]) ?? 0, world.vpp.get(item) ?? 0]
    const more = from > 0 ? `+${Math.round((to / from - 1) * 100)}% per point` : `${fmt(to, 3)} g per point`
    const afterMoves = movesKept && moveKs.includes(k)
    items.push({
      id: `item-${c.id}`,
      kind: 'item',
      // The name already starts with the current item, so only the new one is named.
      title: `Switch ${c.name} to ${humanizeItem(item)}`,
      titleParts: ['Switch ', companyRef(c), ' → ', { item }],
      why: `Adds ${fmt(sw.perDay * horizon)} gold over ${horizon} days${afterMoves ? ' with its team after the moves' : ''},`
        + ` after the switch cost, which is earned back in ${sw.back}.`,
      facts: [
        { label: 'Value per point', value: more, brief: more },
        { label: 'Switch cost', value: `${input.changeItemConcrete} = ${fmt(world.switchCost)} g`, icon: 'concrete' },
        { label: 'Earned back', value: sw.back, brief: `back in ${sw.back}` },
      ],
      gainPerDay: sw.perDay,
    })
  }

  // Tool hand-offs, on top of both; tools that pass between the same companies share a row.
  const plan = clone(switched)
  const handOffs = world.tools.flatMap(({ owner }, ti) => {
    const holder = target.toolOf.indexOf(ti)

    return holder === owner ? [] : [{ ti, owner, holder, ks: [at[owner], at[holder]] }]
  })

  for (const ks of groupsOf(world.companies.length, handOffs.map(h => h.ks))) {
    const row = handOffs.filter(h => ks.includes(h.ks[0]))
    const after = clone(switched)
    row.forEach(h => after.toolOf[h.holder] = h.ti)
    // A giver whose tool went on and who got none back holds nothing.
    row.forEach(h => after.toolOf[h.owner] = target.toolOf[h.owner])
    const tools = gainOf(world, switched, after, ks)
    if (tools.perDay < MIN_GAIN_PER_DAY) {
      continue
    }

    row.forEach((h) => {
      plan.toolOf[h.holder] = h.ti
      plan.toolOf[h.owner] = target.toolOf[h.owner]
    })

    const text = ({ ti, owner, holder }: typeof row[number]) => {
      const { code, pct } = world.tools[ti]

      return `${name(owner)}'s ${toolLabel(code)} (+${pct}%) → ${name(holder)}`
    }

    items.push({
      id: `tool-${row.map(h => world.workers[h.holder].e._id).join('-')}`,
      kind: 'tool',
      title: row.length > 1 ? `Hand over ${plural(row.length, 'tool')}` : `Give ${text(row[0])}`,
      why: `Adds ${fmt(tools.perDay * horizon)} gold over ${horizon} days, with the teams and items above.`,
      facts: tools.facts,
      gainPerDay: tools.perDay,
      byCompany: row.length > 1
        ? ks.flatMap((k) => {
            const steps = row.filter(h => at[h.owner] === k).map(text)

            return steps.length ? [{ company: companyRef(company(k)), steps }] : []
          })
        : undefined,
    })
  }

  const companies = world.companies.map(({ c }, k) => ({
    ...c,
    itemCode: plan.item[k],
    employees: [...c.employees.filter(e => e.companyDisabled), ...plan.team[k].map(i => world.workers[i].e)],
  }))

  return { items, plan, companies }
}
