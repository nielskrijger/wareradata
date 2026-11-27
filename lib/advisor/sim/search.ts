import type { Plan, World } from './world'

import { companyGold } from './world'

/**
 * Gold over the horizon a step must earn before it's worth the player's
 * effort: a drag in Reorganize, a tool hand-off, or a product switch, which
 * also bets on prices holding.
 */
const EFFORT = {
  move: 10,
  tool: 3,
  switch: 30,
}

export function clone(plan: Plan): Plan {
  return { item: [...plan.item], team: plan.team.map(t => [...t]), toolOf: [...plan.toolOf] }
}

export function companyOf(plan: Plan): number[] {
  const of: number[] = []
  plan.team.forEach((ids, k) => ids.forEach((i) => {
    of[i] = k
  }))

  return of
}

/**
 * Effort of a plan against today's: workers away from home, tools away from
 * their owner, companies on another item.
 */
function effort(world: World, plan: Plan): number {
  const at = companyOf(plan)
  const moved = world.workers.filter((w, i) => at[i] !== w.home).length
  const tools = world.tools.filter((t, ti) => plan.toolOf[t.owner] !== ti).length
  const switched = plan.item.filter((item, k) => item !== world.today.item[k]).length

  return EFFORT.move * moved + EFFORT.tool * tools + EFFORT.switch * switched
}

/**
 * One change to a plan and the companies it touches.
 */
interface Step {
  plan: Plan
  touched: number[]
}

/**
 * Every plan one step away: two workers trade places (or one takes an empty
 * slot), two workers trade tools (or one hands theirs over), or a company
 * switches item.
 */
function* neighbours(world: World, plan: Plan): Generator<Step> {
  const n = plan.team.length
  const room = (k: number) => world.companies[k].c.employeeCap - world.companies[k].idle - plan.team[k].length > 0

  for (let a = 0; a < n; a++) {
    for (let b = a + 1; b < n; b++) {
      const xs: (number | null)[] = [...plan.team[a], ...room(a) ? [null] : []]
      const ys: (number | null)[] = [...plan.team[b], ...room(b) ? [null] : []]
      for (const x of xs) {
        for (const y of ys) {
          if (x === null && y === null) {
            continue
          }

          const next = clone(plan)
          next.team[a] = [...plan.team[a].filter(i => i !== x), ...y === null ? [] : [y]]
          next.team[b] = [...plan.team[b].filter(i => i !== y), ...x === null ? [] : [x]]
          yield { plan: next, touched: [a, b] }
        }
      }
    }
  }

  const at = companyOf(plan)
  for (let ti = 0; ti < world.tools.length; ti++) {
    const holder = plan.toolOf.indexOf(ti)
    for (let y = 0; y < world.workers.length; y++) {
      if (y === holder || at[y] === undefined) {
        continue
      }

      const next = clone(plan)
      next.toolOf[y] = ti
      next.toolOf[holder] = plan.toolOf[y]
      yield { plan: next, touched: [...new Set([at[holder], at[y]])] }
    }
  }

  for (let k = 0; k < n; k++) {
    for (const item of world.vpp.keys()) {
      if (item !== plan.item[k] && plan.team[k].length) {
        const next = clone(plan)
        next.item[k] = item
        yield { plan: next, touched: [k] }
      }
    }
  }
}

/**
 * Greedy best step, again and again, until no step earns more than its
 * effort. On this game's rosters it lands within a few percent of a far wider
 * search for the same number of steps.
 *
 * `allowSwitch` false keeps every company on today's item.
 */
export function searchPlan(world: World, allowSwitch = true): Plan {
  let plan = clone(world.today)
  let gold = plan.team.map((_, k) => companyGold(world, plan, k))
  let cost = effort(world, plan)

  for (let round = 0; round < 200; round++) {
    let best: { step: Step, gold: number[], cost: number, gain: number } | null = null
    for (const step of neighbours(world, plan)) {
      if (!allowSwitch && step.plan.item.some((item, k) => item !== world.today.item[k])) {
        continue
      }

      const nextGold = [...gold]
      for (const k of step.touched) {
        nextGold[k] = companyGold(world, step.plan, k)
      }

      const nextCost = effort(world, step.plan)
      const gain = step.touched.reduce((s, k) => s + nextGold[k] - gold[k], 0) - (nextCost - cost)
      if (gain > 0 && (!best || gain > best.gain)) {
        best = { step, gold: nextGold, cost: nextCost, gain }
      }
    }

    if (!best) {
      break
    }

    plan = best.step.plan
    gold = best.gold
    cost = best.cost
  }

  return plan
}
