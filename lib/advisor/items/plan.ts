import type { Plan, World } from '../sim/world'
import type { AdvisorCompany, AdvisorInput, Fact, TitlePart, TodoItem } from '../types'

import { humanizeItem } from '@/components/factories/format'
import { rarityLabel } from '@/lib/gear/rarity'
import { RULES } from '../model'
import { companyRef, firstName, fmt, MIN_GAIN_PER_DAY, signedFmt } from '../shared'
import { companyOf, searchPlan } from '../sim/search'
import { companyDaily } from '../sim/world'

/**
 * One thing the player does: move a worker, switch an item, or hand over a tool.
 */
interface Change {
  kind: 'move' | 'item' | 'tool'

  /**
   * Companies whose output it changes.
   */
  companies: number[]

  /**
   * The company it's listed under, and what to do there.
   */
  at: number
  step: TitlePart[]
}

function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? '' : 's'}`
}

function toolLabel(code: string): string {
  const m = /^([a-z]+)(\d)$/i.exec(code)

  return m ? `${rarityLabel(Number(m[2])).toLowerCase()} ${m[1]}` : code
}

function text(world: World, parts: TitlePart[]): string {
  const name = (id: string) => world.companies.find(({ c }) => c.id === id)?.c.name

  return parts.map(p => (typeof p === 'string' ? p : 'item' in p ? humanizeItem(p.item) : name(p.id))).join('')
}

/**
 * Everything the plan changes against today.
 */
function changesOf(world: World, plan: Plan): Change[] {
  const at = companyOf(plan)
  const name = (i: number) => firstName(world.workers[i].e.name)
  const ref = (k: number) => companyRef(world.companies[k].c)

  return [
    ...world.workers.flatMap((w, i) => (at[i] === w.home
      ? []
      : [{ kind: 'move' as const, companies: [w.home, at[i]], at: w.home, step: [`${name(i)} → `, ref(at[i])] }])),
    ...plan.item.flatMap((item, k) => (item === world.today.item[k]
      ? []
      : [{ kind: 'item' as const, companies: [k], at: k, step: ['Switch to ', { item }] }])),
    ...world.tools.flatMap(({ code, pct, owner }, ti) => {
      const holder = plan.toolOf.indexOf(ti)
      const home = world.workers[owner].home

      return holder === owner
        ? []
        : [{
            kind: 'tool' as const,
            companies: [home, at[owner], at[holder]],
            at: home,
            step: [`${name(owner)}'s ${toolLabel(code)} (+${pct}%) → ${name(holder)}`],
          }]
    }),
  ]
}

/**
 * Changes that share a company share a row, so rows can be done in any order
 * and each row's gain is exact. All moves share one: it's one trip to Reorganize.
 */
function rowsOf(world: World, changes: Change[]): Change[][] {
  const root = world.companies.map((_, k) => k)
  const find = (k: number): number => (root[k] === k ? k : (root[k] = find(root[k])))
  const join = (ks: number[]) => ks.forEach(k => root[find(k)] = find(ks[0]))
  changes.forEach(c => join(c.companies))
  join(changes.filter(c => c.kind === 'move').flatMap(c => c.companies))

  const rows = new Map<number, Change[]>()
  for (const c of changes) {
    rows.set(find(c.at), [...rows.get(find(c.at)) ?? [], c])
  }

  return [...rows.values()]
}

/**
 * One change is named in full; more are counted and listed under the row.
 */
function title(world: World, row: Change[]): Pick<TodoItem, 'title' | 'titleParts'> {
  if (row.length === 1) {
    const parts = [companyRef(world.companies[row[0].at].c), ': ', ...row[0].step]

    return { title: text(world, parts), titleParts: parts }
  }

  const count = (kind: Change['kind']) => row.filter(c => c.kind === kind).length
  const [moves, items, tools] = [count('move'), count('item'), count('tool')]
  if (moves) {
    return { title: `Move ${plural(moves, 'worker')}` }
  }

  const switched = items === 1 ? world.companies[row.find(c => c.kind === 'item')!.at].c.name : plural(items, 'company')
  const title = [items && `switch ${switched}`, tools && `hand over ${plural(tools, 'tool')}`]
    .filter(Boolean)
    .join(', and ')

  return { title: title.charAt(0).toUpperCase() + title.slice(1) }
}

/**
 * The plan for the owner's companies (who works where, who holds which tool,
 * what each company makes) as rows of changes, each step listed under its
 * company in the game's company order.
 *
 * Returns the companies as the plan leaves them, for the advice that builds on
 * the new teams.
 */
export function planItems(input: AdvisorInput, world: World): {
  items: TodoItem[]
  plan: Plan
  companies: AdvisorCompany[]
} {
  const plan = searchPlan(world)
  const { today } = world
  const horizon = RULES.horizonDays
  const items: TodoItem[] = []

  for (const row of rowsOf(world, changesOf(world, plan))) {
    const ks = [...new Set(row.flatMap(c => c.companies))].sort((a, b) => a - b)
    const gains = ks.map(k => companyDaily(world, plan, k).map((g, d) => g - companyDaily(world, today, k)[d]))
    const daily = gains[0].map((_, d) => gains.reduce((s, x) => s + x[d], 0))
    const gain = daily.reduce((s, g) => s + g, 0)
    if (gain / horizon < MIN_GAIN_PER_DAY) {
      // Left as today, so the advice that builds on the plan doesn't count it.
      for (const k of ks) {
        plan.item[k] = today.item[k]
        plan.team[k] = [...today.team[k]]
        today.team[k].forEach(i => plan.toolOf[i] = today.toolOf[i])
      }

      continue
    }

    const switches = row.filter(c => c.kind === 'item').length
    const moves = row.some(c => c.kind === 'move')
    let total = 0
    const back = plural(daily.findIndex(g => (total += g) >= 0) + 1, 'day')
    const facts: Fact[] = [
      ...switches
        ? [
            {
              label: 'Switch cost',
              value: `${switches * input.changeItemConcrete} = ${fmt(switches * world.switchCost)} g`,
              icon: 'concrete',
            },
            { label: 'Earned back', value: back, brief: `back in ${back}` },
          ]
        : [],
      ...ks.length > 1
        ? ks.map((k, i) => ({
            label: world.companies[k].c.name,
            value: `${signedFmt(gains[i].reduce((s, g) => s + g, 0) / horizon)} g/day`,
          }))
        : [],
    ]

    items.push({
      id: `plan-${ks.map(k => world.companies[k].c.id).join('-')}`,
      kind: moves ? 'move' : switches ? 'item' : 'tool',
      ...title(world, row),
      why: [
        `Adds ${fmt(gain)} gold over ${horizon} days`,
        switches ? `, after the switch cost, which is earned back in ${back}` : '',
        '.',
        moves ? ' In Workforce, press Reorganize, drag each worker to the company named, then Apply.' : '',
      ].join(''),
      facts,
      gainPerDay: gain / horizon,
      byCompany: row.length > 1
        ? ks.flatMap((k) => {
            const steps = row.filter(c => c.at === k).map(c => c.step)

            return steps.length ? [{ company: companyRef(world.companies[k].c), steps }] : []
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
