import type { Plan, SimTool, SimWorker, World } from '../sim/world'
import type { AdvisorCompany, AdvisorInput, Fact, TitlePart, TodoItem } from '../types'

import { humanizeCode, humanizeItem } from '@/components/factories/format'
import { rarityLabel } from '@/lib/gear/rarity'
import { RULES } from '../model'
import { companyRef, firstName, fmt, MIN_GAIN_PER_DAY, signedFmt } from '../shared'
import { companyOf, searchPlan } from '../sim/search'
import { companyDaily } from '../sim/world'

interface Move {
  w: SimWorker
  from: AdvisorCompany
  to: AdvisorCompany
}

/**
 * A tool going from its owner to whoever holds it in the plan.
 */
interface Leg {
  tool: SimTool
  from: SimWorker
  to: SimWorker
}

function toolLabel(code: string): string {
  const m = /^([a-z]+)(\d)$/i.exec(code)

  return m ? `${rarityLabel(Number(m[2])).toLowerCase()} ${m[1]}` : code
}

function legText({ tool, from, to }: Leg): string {
  return `${firstName(from.e.name)}'s ${toolLabel(tool.code)} (+${tool.pct}%) to ${firstName(to.e.name)}`
}

function joinNames(names: string[]): string {
  return names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names.at(-1)}` : names[0] ?? ''
}

function companiesTitle(lead: string, companies: AdvisorCompany[]): Pick<TodoItem, 'title' | 'titleParts'> {
  const parts: TitlePart[] = [lead]
  companies.forEach((c, i) => {
    if (i > 0) {
      parts.push(i === companies.length - 1 ? ' and ' : ', ')
    }

    parts.push(companyRef(c))
  })

  return { title: `${lead}${joinNames(companies.map(c => c.name))}`, titleParts: parts }
}

function movesTitle(moves: Move[], companies: AdvisorCompany[]): Pick<TodoItem, 'title' | 'titleParts'> {
  const [a, b] = moves
  if (moves.length === 1) {
    const lead = `Move ${firstName(a.w.e.name)} from `

    return {
      title: `${lead}${a.from.name} to ${a.to.name}`,
      titleParts: [lead, companyRef(a.from), ' to ', companyRef(a.to)],
    }
  }

  if (moves.length === 2 && a.from === b.to && a.to === b.from) {
    const lead = `Swap ${firstName(a.w.e.name)} at `
    const mid = ` with ${firstName(b.w.e.name)} at `

    return {
      title: `${lead}${a.from.name}${mid}${b.from.name}`,
      titleParts: [lead, companyRef(a.from), mid, companyRef(b.from)],
    }
  }

  return companiesTitle(`Move ${moves.length} workers between `, companies)
}

/**
 * A single hand-off names the company; a chain names only the people, to stay readable.
 */
function legsTitle(legs: Leg[], companies: AdvisorCompany[]): Pick<TodoItem, 'title' | 'titleParts'> {
  if (legs.length > 1) {
    return { title: `Give ${legs.map(legText).join(', and ')}` }
  }

  return companiesTitle(`Give ${legText(legs[0])} at `, companies)
}

/**
 * The plan for the owner's companies (who works where, who holds which tool,
 * what each company makes) and one row per group of changes that share
 * companies. Groups touch no common company, so rows can be done in any order
 * and each row's gain is exact.
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
  const today = world.today
  const at = companyOf(plan)
  const company = (k: number) => world.companies[k].c

  const moved = world.workers.filter((w, i) => at[i] !== w.home)
  const legs: Leg[] = world.tools.flatMap((tool, ti) => {
    const holder = plan.toolOf.indexOf(ti)

    return holder === tool.owner ? [] : [{ tool, from: world.workers[tool.owner], to: world.workers[holder] }]
  })

  const switched = plan.item.flatMap((item, k) => (item === today.item[k] ? [] : [k]))

  const group = world.companies.map((_, k) => k)
  const root = (k: number): number => (group[k] === k ? k : (group[k] = root(group[k])))
  const link = (ks: number[]) => ks.forEach(k => group[root(k)] = root(ks[0]))
  const touched = new Set(switched)
  const indexOf = (w: SimWorker) => world.workers.indexOf(w)
  for (const w of moved) {
    link([w.home, at[indexOf(w)]])
  }

  for (const l of legs) {
    link([l.from.home, at[indexOf(l.from)], at[indexOf(l.to)]])
  }

  for (const w of moved) {
    touched.add(w.home).add(at[indexOf(w)])
  }

  for (const l of legs) {
    touched.add(l.from.home).add(at[indexOf(l.from)]).add(at[indexOf(l.to)])
  }

  const groups = new Map<number, number[]>()
  for (const k of [...touched].sort((a, b) => a - b)) {
    groups.set(root(k), [...groups.get(root(k)) ?? [], k])
  }

  const horizon = RULES.horizonDays
  const items: TodoItem[] = []
  for (const ks of groups.values()) {
    // Each company's gold, day by day, against today's.
    const diffs = ks.map(k => companyDaily(world, plan, k).map((g, d) => g - companyDaily(world, today, k)[d]))
    const daily = diffs[0].map((_, d) => diffs.reduce((s, x) => s + x[d], 0))
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

    const companies = ks.map(company)
    const rowMoves: Move[] = moved
      .filter(w => ks.includes(w.home))
      .map(w => ({ w, from: company(w.home), to: company(at[indexOf(w)]) }))

    const rowLegs = legs.filter(l => ks.includes(l.from.home))
    const rowSwitches = switched.filter(k => ks.includes(k))

    let total = 0
    const back = daily.findIndex(g => (total += g) >= 0) + 1
    const backIn = `${back} day${back === 1 ? '' : 's'}`
    const facts: Fact[] = [
      ...rowMoves.map(m => ({
        label: m.w.e.name,
        value: `${m.from.name} → ${m.to.name}`,
        brief: rowMoves.length > 2 ? `${firstName(m.w.e.name)} → ${m.to.name}` : undefined,
      })),
      ...rowSwitches.map((k) => {
        const item = plan.item[k]
        const [from, to] = [world.vpp.get(today.item[k]) ?? 0, world.vpp.get(item) ?? 0]
        const more = from > 0 ? `+${Math.round((to / from - 1) * 100)}% per point` : `${fmt(to, 3)} g per point`

        return {
          label: `${company(k).name} → ${humanizeCode(plan.item[k])}`,
          value: more,
          brief: rowMoves.length || rowSwitches.length > 1 ? `${company(k).name} → ${humanizeCode(item)}` : more,
        }
      }),
      ...rowLegs.map(l => ({
        label: 'Tool',
        value: legText(l),
        brief: rowMoves.length || rowSwitches.length || rowLegs.length > 1 ? undefined : legText(l).replace(/ to .*/, ''),
      })),
      ...rowSwitches.length
        ? [
            {
              label: 'Switch cost',
              value: `${rowSwitches.length * input.changeItemConcrete} = ${fmt(rowSwitches.length * world.switchCost)} g`,
              icon: 'concrete',
            },
            { label: 'Earned back', value: backIn, brief: `back in ${backIn}` },
          ]
        : [],
      ...ks.length > 1
        ? ks.map((k, i) => ({
            label: company(k).name,
            value: `${signedFmt(diffs[i].reduce((s, g) => s + g, 0) / horizon)} g/day`,
          }))
        : [],
    ]

    const [first] = rowSwitches
    const tools = rowLegs.length ? `, and hand over ${rowLegs.length} tool${rowLegs.length === 1 ? '' : 's'}` : ''
    const heading = rowMoves.length
      ? movesTitle(rowMoves, companies)
      : rowSwitches.length === 1
        ? {
            // The name already starts with the current item, so only the new one is named.
            title: `Switch ${company(first).name} to ${humanizeItem(plan.item[first])}${tools}`,
            titleParts: ['Switch ', companyRef(company(first)), ' → ', { item: plan.item[first] }, tools],
          }
        : rowSwitches.length
          ? companiesTitle('Switch and rearrange ', companies)
          : legsTitle(rowLegs, companies)

    const steps = [
      ...rowMoves.length || rowSwitches.length > 1
        ? rowSwitches.map(k => `Switch ${company(k).name} to ${humanizeItem(plan.item[k])}.`)
        : [],
      rowMoves.length ? 'In Workforce, press Reorganize, drag each worker to the company named, then Apply.' : '',
      rowLegs.length ? `Hand ${rowLegs.length > 1 ? 'each tool' : 'the tool'} over as named.` : '',
    ].filter(Boolean)

    items.push({
      id: `plan-${ks.map(k => company(k).id).join('-')}`,
      kind: rowMoves.length ? 'move' : rowSwitches.length ? 'item' : 'tool',
      ...heading,
      why: [
        `Adds ${fmt(gain)} gold over ${horizon} days`,
        rowSwitches.length ? `, after the switch cost, which is earned back in ${backIn}` : '',
        '.',
        ...steps.map(s => ` ${s}`),
      ].join(''),
      facts,
      gainPerDay: gain / horizon,
    })
  }

  const companies = world.companies.map(({ c }, k) => ({
    ...c,
    itemCode: plan.item[k],
    employees: [...c.employees.filter(e => e.companyDisabled), ...plan.team[k].map(i => world.workers[i].e)],
  }))

  return { items, plan, companies }
}
