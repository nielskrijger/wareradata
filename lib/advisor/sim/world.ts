import type { EmployeeLike } from '../model'
import type { AdvisorCompany, AdvisorInput } from '../types'
import type { RuleContext, TraitRule } from './rules'

import { effectiveManagerPct, HOURS_PER_DAY, payingDays, RULES, toolFits } from '../model'
import { bonusPct, heldToolPct } from '../shared'
import { gameTotals, HAPPINESS_CAP, MOVE_COST, REGION_TRAITS, RULE_CODES, ruleTotals } from './rules'

const DAY_MS = HOURS_PER_DAY * 3600_000

export interface SimCompany {
  c: AdvisorCompany
  managerPct: number
  regionPct: number

  /**
   * The owner's Management bonus, which caps what a manager adds.
   */
  managementPct: number

  /**
   * Slots taken by employees who don't work, which still count toward the cap.
   */
  idle: number
}

/**
 * A worker as the simulator sees them: what goes along wherever they work,
 * and what each place and team adds back.
 */
export interface SimWorker {
  e: EmployeeLike
  home: number

  /**
   * Days they keep working within the horizon, before retiring.
   */
  days: number
  wage: number
  fixedStat: number
  fixedPct: number

  /**
   * Happiness that goes along, and the part of it that ends after some days.
   */
  happyFixed: number
  happyTemp: { delta: number, days: number }[]

  /**
   * Region traits keep today's effect only in today's region.
   */
  homeRegion: string
  regionStat: number
  regionHappy: number
  movePenalty: boolean
}

export interface SimTool {
  code: string
  pct: number
  owner: number
}

/**
 * Who works where, who holds which tool, and what each company makes.
 */
export interface Plan {
  item: string[]
  team: number[][]

  /**
   * Tool index per worker, or -1.
   */
  toolOf: number[]
}

export interface World {
  companies: SimCompany[]
  workers: SimWorker[]
  tools: SimTool[]
  vpp: Map<string, number>
  rawGoods: Set<string>
  wages: Map<EmployeeLike, number>

  /**
   * Gold it costs to change what a company makes.
   */
  switchCost: number
  today: Plan
  cache: Map<string, number[]>
}

/**
 * The employees a company has at work: none while it's disabled.
 */
function working(c: AdvisorCompany): EmployeeLike[] {
  return c.disabled ? [] : c.employees
}

function clampHappy(pct: number): number {
  return Math.max(-HAPPINESS_CAP, Math.min(HAPPINESS_CAP, pct))
}

/**
 * Whether moving costs happiness for this owner: yes, unless a worker moved in
 * the last week shows no such cost.
 */
function movePenaltyApplies(input: AdvisorInput): boolean {
  const recent = input.companies.flatMap(c => c.employees)
    .filter(e => e.lastMovedAt && Date.now() - Date.parse(e.lastMovedAt) < MOVE_COST.happinessDays * DAY_MS)

  return recent.every(e => e.happinessBreakdown?.contributions?.some(x => x.reason === 'recentlyMoved'))
}

/**
 * Everything a worker's bonus gets from one place and team on one day, apart
 * from what goes along with them.
 */
interface DayParts {
  stat: number
  pct: number
}

function ruleContext(
  world: World,
  w: SimWorker,
  item: string,
  others: EmployeeLike[],
  k: number,
  tool: SimTool | null,
): RuleContext {
  return {
    e: w.e,
    others,
    wageOf: o => world.wages.get(o) ?? 0,
    itemCode: item,
    rawGood: world.rawGoods.has(item),
    storageLevel: world.companies[k].c.storageLevel,
    toolUsable: toolPctOn(tool, item) > 0,
  }
}

function toolPctOn(tool: SimTool | null, item: string): number {
  return tool && toolFits(tool.code, item) ? tool.pct : 0
}

/**
 * The stat and bonus a worker gets at company `k` making `item` on day `d`,
 * given what the trait rules give them next to that day's team. `managerPct`
 * can stand in for the company's.
 */
function dayParts(
  world: World,
  w: SimWorker,
  k: number,
  item: string,
  rules: Record<TraitRule['kind'], number>,
  tool: SimTool | null,
  d: number,
  managerPct = world.companies[k].managerPct,
): DayParts {
  const place = world.companies[k]
  const sameRegion = place.c.regionId === w.homeRegion
  const moved = k !== w.home
  const spec = Math.min(RULES.specializationCapPct, (w.e.specializations?.[item] ?? 0) + d)
  const happy = w.happyFixed
    + w.happyTemp.reduce((s, t) => s + (d < t.days ? t.delta : 0), 0)
    + rules.happiness
    + (sameRegion ? w.regionHappy : 0)
    + (moved && w.movePenalty && d < MOVE_COST.happinessDays ? MOVE_COST.happiness : 0)

  const habit = moved && d < MOVE_COST.creatureOfHabitDays && (w.e.traits ?? []).some(t => t.code === 'creatureOfHabit')

  return {
    stat: rules.stat + (sameRegion ? w.regionStat : 0),
    pct: managerPct + place.regionPct + spec + toolPctOn(tool, item) + rules.bonus + clampHappy(happy)
      + (habit ? MOVE_COST.creatureOfHabitPct : 0),
  }
}

/**
 * Builds the simulator's world from the advisor input. What goes along with
 * each worker is today's total minus what today's place and team add, so
 * today's output is reproduced exactly.
 */
export function buildWorld(input: AdvisorInput, vpp: Map<string, number>): World {
  const movePenalty = movePenaltyApplies(input)
  const now = Date.now()
  const workers: SimWorker[] = []
  const tools: SimTool[] = []
  const toolOf: number[] = []

  // Management is the owner's own skill, so any working employee shows it.
  const anyone = input.companies.find(c => !c.disabled && c.employees.length)?.employees[0]
  const managementPct = anyone ? bonusPct(anyone, 'management') : 0
  const companies: SimCompany[] = input.companies.map((c) => {
    const first = c.disabled ? undefined : c.employees[0]

    return {
      c,
      managerPct: first
        ? bonusPct(first, 'manager')
        : effectiveManagerPct(c.manager?.productionBonusPercent ?? 0, managementPct),
      regionPct: first ? bonusPct(first, 'coreRegion') : 0,
      managementPct,
      // A disabled company's slots can't be filled.
      idle: c.disabled ? c.employeeCap : 0,
    }
  })

  const team = input.companies.map((c, home) => working(c).map((e) => {
    const hb = e.happinessBreakdown
    let happyFixed = (hb?.base ?? 50) - 50 + (hb?.mitigated ?? 0)
    let regionHappy = 0
    const happyTemp: SimWorker['happyTemp'] = []
    for (const x of hb?.contributions ?? []) {
      if (x.code && RULE_CODES.happiness.has(x.code)) {
        continue
      }

      if (x.reason === 'trait' && x.code && REGION_TRAITS.has(x.code)) {
        regionHappy += x.delta
      } else if (x.until) {
        happyTemp.push({ delta: x.delta, days: Math.max(0, (Date.parse(x.until) - now) / DAY_MS) })
      } else {
        happyFixed += x.delta
      }
    }

    const pct = heldToolPct(e)
    if (e.toolItem && pct > 0) {
      tools.push({ code: e.toolItem.code, pct, owner: workers.length })
    }

    toolOf.push(e.toolItem && pct > 0 ? tools.length - 1 : -1)
    workers.push({
      e,
      home,
      days: payingDays(e),
      wage: e.estimate?.wage ?? e.wage ?? 0,
      fixedStat: 0,
      fixedPct: 0,
      happyFixed,
      happyTemp,
      homeRegion: c.regionId,
      regionStat: (e.breakdown?.production?.contributions ?? [])
        .filter(x => !x.percent && REGION_TRAITS.has(x.code))
        .reduce((s, x) => s + x.delta, 0),
      regionHappy,
      movePenalty,
    })

    return workers.length - 1
  }))

  const world: World = {
    companies,
    workers,
    tools,
    vpp,
    rawGoods: input.rawGoods,
    wages: new Map(workers.map(w => [w.e, w.wage])),
    switchCost: input.changeItemConcrete * (input.prices.concrete ?? Number.POSITIVE_INFINITY),
    today: { item: input.companies.map(c => c.itemCode), team, toolOf },
    cache: new Map(),
  }

  team.forEach((ids, k) => {
    for (const i of ids) {
      const w = workers[i]
      const others = ids.filter(j => j !== i).map(j => workers[j].e)
      const tool = toolOf[i] >= 0 ? tools[toolOf[i]] : null
      const item = input.companies[k].itemCode
      const rules = ruleTotals(ruleContext(world, w, item, others, k, tool))
      const parts = dayParts(world, w, k, item, rules, tool, 0)
      w.fixedStat = (w.e.breakdown?.production?.total ?? 0) - parts.stat
      w.fixedPct = (w.e.productionBonus?.total ?? 0) - parts.pct
    }
  })

  return world
}

/**
 * Gold company `k` makes each day of the horizon under a plan: staff and
 * engine output at the item's value per point, less the switch cost on day one.
 * Wages don't depend on the plan, so they're left out.
 *
 * A retiree's slot counts for nothing after they leave, whatever the plan, so
 * guesses about their replacement can't steer it.
 */
export function companyDaily(world: World, plan: Plan, k: number, managerPct?: number): number[] {
  const item = plan.item[k]
  const ids = plan.team[k]
  const staff = [...ids].sort((a, b) => a - b).map(i => `${i}:${plan.toolOf[i]}`).join(',')
  const key = `${k}|${item}|${managerPct ?? ''}|${staff}`
  const hit = world.cache.get(key)
  if (hit) {
    return hit
  }

  const place = world.companies[k]
  const vpp = world.vpp.get(item) ?? 0
  const toolOf = (i: number) => (plan.toolOf[i] >= 0 ? world.tools[plan.toolOf[i]] : null)
  const daily: number[] = []
  // The rules only change when someone retires, so they're worked out once per team.
  let rules = new Map<number, Record<TraitRule['kind'], number>>()
  let teamSize = -1
  for (let d = 0; d < RULES.horizonDays; d++) {
    const active = ids.filter(i => d < world.workers[i].days)
    if (active.length !== teamSize) {
      teamSize = active.length
      rules = new Map(active.map((i) => {
        const others = active.filter(j => j !== i).map(j => world.workers[j].e)

        return [i, ruleTotals(ruleContext(world, world.workers[i], item, others, k, toolOf(i)))]
      }))
    }

    let points = place.c.enginePointsPerDay
    for (const i of active) {
      const w = world.workers[i]
      const parts = dayParts(world, w, k, item, rules.get(i)!, toolOf(i), d, managerPct)
      const stat = w.fixedStat + parts.stat
      points += HOURS_PER_DAY * (stat / RULES.productionDivisor) * (1 + (w.fixedPct + parts.pct) / 100)
    }

    daily.push(points * vpp - (d === 0 && item !== world.today.item[k] ? world.switchCost : 0))
  }

  world.cache.set(key, daily)

  return daily
}

export function companyGold(world: World, plan: Plan, k: number, managerPct?: number): number {
  return companyDaily(world, plan, k, managerPct).reduce((s, g) => s + g, 0)
}

/**
 * Each employee's trait effects as the rules give them next to the game's, so
 * `check-advisor` catches a rule that changed.
 */
export function ruleCheck(input: AdvisorInput) {
  return input.companies.flatMap((c) => {
    const team = working(c)

    return team.map((e) => {
      const tool = e.toolItem ? { code: e.toolItem.code, pct: heldToolPct(e), owner: 0 } : null
      const ours = ruleTotals({
        e,
        others: team.filter(o => o !== e),
        wageOf: o => o.estimate?.wage ?? o.wage ?? 0,
        itemCode: c.itemCode,
        rawGood: input.rawGoods.has(c.itemCode),
        storageLevel: c.storageLevel,
        toolUsable: toolPctOn(tool, c.itemCode) > 0,
      })

      return { name: e.name, ours, game: gameTotals(e) }
    })
  })
}
