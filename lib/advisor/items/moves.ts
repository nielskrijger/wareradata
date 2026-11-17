import type { EmployeeLike } from '../model'
import type { AdvisorCompany, AdvisorInput, Fact, TitlePart, TodoItem } from '../types'

import { basePerHour, HOURS_PER_DAY, payingDays, RULES, toolFits } from '../model'
import { bonusPct, companyRef, firstName, fmt, heldToolPct, signedFmt } from '../shared'

/**
 * Gold over the horizon a single swap must add: a move is a drag in the game,
 * and smaller gains drown in daily price moves.
 */
const MIN_SWAP_GAIN = 10

/**
 * Trait rules the API doesn't document, read off the breakdowns of 7,000
 * employees across 2,800 companies; `check-advisor` re-checks them on the
 * owner's roster.
 */
const TRAIT = {
  /**
   * Production percent per coworker, or for the team as a whole.
   */
  sociablePerCoworker: 25,
  girlPowerPerWoman: 15,
  bandOfBrothersPerMan: 15,
  misogynistPerWoman: -15,
  manHaterPerMan: -15,
  lonerAlone: 100,
  primaDonnaTopWage: 20,

  /**
   * Production percent while the trait's named coworker is on the team.
   */
  partners: { oldFriends: 15, sweethearts: 20, nemesis: -15 } as Record<string, number>,
  handyWithTool: 40,
  improviserWithoutTool: 25,

  /**
   * Below this storage level a claustrophobe loses 20%.
   */
  claustrophobeStorage: 3,
  claustrophobe: -20,

  /**
   * Happiness, which adds a production percent per point away from 50, within this.
   */
  happinessCap: 50,
  lonerAloneHappy: 5,
  sociableAloneHappy: -10,
  primaDonnaNotTopHappy: -10,
  enviousPerRicher: -5,
  xenophobeForeign: -5,
  comicCoworker: 10,
  foremanPerCoworker: 9,
  bullyPerCoworker: -10,

  /**
   * Some owners' moved workers lose 10 happiness for 7 days, others' don't;
   * a creature of habit loses 30% for 3 days.
   */
  movedHappy: -10,
  movedDays: 7,
  creatureOfHabit: -30,
  creatureOfHabitDays: 3,
}

/**
 * Happiness entries the team rules above recompute, by trait code or reason.
 */
const TEAM_HAPPY_CODES = new Set([
  'loner',
  'sociable',
  'primaDonna',
  'envious',
  'xenophobe',
  'comic',
  'foreman',
  'bully',
])

/**
 * Own happiness traits tied to the place: the item made, or the region.
 */
const ITEM_TRAITS = new Set(['specialist'])
const REGION_TRAITS = new Set(['patriot', 'nationalist', 'homesick', 'expat'])

/**
 * Parts of the production bonus that change with the company or the team, with
 * the game's sources behind each. The rest (owner Management, events, taxes)
 * goes along unchanged. `moving` is the temporary cost of a move, which the
 * game shows as happiness.
 */
const PART_SOURCES = {
  manager: ['manager'],
  place: ['coreRegion', 'claustrophobe'],
  specialization: ['specialization'],
  tool: ['tool', 'handy', 'improviser'],
  coworkers: [
    ...Object.keys(TRAIT.partners),
    'sociable',
    'girlPower',
    'bandOfBrothers',
    'misogynist',
    'manHater',
    'loner',
    'primaDonna',
  ],
  happiness: ['happiness'],
  moving: [] as string[],
}

type Part = keyof typeof PART_SOURCES
type Parts = Record<Part, number>
const PARTS = Object.keys(PART_SOURCES) as Part[]

const DRIVER_LABEL: Record<Part | 'value', string> = {
  value: 'Value per point',
  manager: 'Manager bonus',
  place: 'Region and storage',
  specialization: 'Specialization',
  tool: 'Tools',
  coworkers: 'Coworker traits',
  happiness: 'Happiness',
  moving: 'Settling in',
}

interface Place {
  c: AdvisorCompany
  vpp: number
  managerPct: number
  regionPct: number

  /**
   * Slots taken by employees who don't work, which still count toward the cap.
   */
  idle: number
}

interface Worker {
  e: EmployeeLike
  home: number
  base: number
  days: number
  wage: number

  /**
   * Bonus percent that goes wherever the worker goes.
   */
  fixedPct: number

  /**
   * Happiness percent that goes along, including what Loyal mitigates today.
   */
  happyPct: number
  itemTraits: { item?: string, delta: number }[]
  regionTraits: number
  homeRegion: string
  movePenalty: boolean
}

interface Move {
  w: Worker
  from: Place
  to: Place
}

/**
 * Average specialization over the days a worker keeps working, growing a point a day.
 */
function avgSpec(start: number, days: number): number {
  if (days <= 0) {
    return 0
  }

  let sum = 0
  for (let d = 0; d < days; d++) {
    sum += Math.min(RULES.specializationCapPct, start + d)
  }

  return sum / days
}

function owns(e: EmployeeLike, code: string): boolean {
  return (e.traits ?? []).some(t => t.code === code)
}

function sumParts(p: Parts): number {
  return PARTS.reduce((s, k) => s + p[k], 0)
}

/**
 * The bonus parts a worker gets at a place next to a team that includes them.
 * `specDays` averages specialization over that many days; 1 gives today's.
 * A worker away from home pays the move's temporary cost, spread over their days.
 */
function partsAt(w: Worker, p: Place, team: Worker[], specDays = w.days): Parts {
  const e = w.e
  const others = team.filter(o => o !== w)
  const has = (code: string) => owns(e, code)
  const count = (pick: (o: Worker) => boolean) => others.filter(pick).length
  const women = count(o => o.e.gender === 'female')
  const men = count(o => o.e.gender === 'male')
  const alone = others.length === 0
  const topWage = !alone && others.every(o => o.wage < w.wage)
  const tool = e.toolItem && toolFits(e.toolItem.code, p.c.itemCode) ? heldToolPct(e) : 0

  let coworkers = 0
  for (const t of e.traits ?? []) {
    if (t.code in TRAIT.partners && others.some(o => o.e._id === t.arg)) {
      coworkers += TRAIT.partners[t.code]
    }
  }

  coworkers += (has('sociable') ? TRAIT.sociablePerCoworker * others.length : 0)
    + (has('girlPower') ? TRAIT.girlPowerPerWoman * women : 0)
    + (has('bandOfBrothers') ? TRAIT.bandOfBrothersPerMan * men : 0)
    + (has('misogynist') ? TRAIT.misogynistPerWoman * women : 0)
    + (has('manHater') ? TRAIT.manHaterPerMan * men : 0)
    + (has('loner') && alone ? TRAIT.lonerAlone : 0)
    + (has('primaDonna') && topWage ? TRAIT.primaDonnaTopWage : 0)

  const happy = w.happyPct
    + w.itemTraits.reduce((s, t) => s + (t.item === p.c.itemCode ? t.delta : 0), 0)
    + (p.c.regionId === w.homeRegion ? w.regionTraits : 0)
    + (has('loner') && alone ? TRAIT.lonerAloneHappy : 0)
    + (has('sociable') && alone ? TRAIT.sociableAloneHappy : 0)
    + (has('primaDonna') && !alone && !topWage ? TRAIT.primaDonnaNotTopHappy : 0)
    + (has('envious') ? TRAIT.enviousPerRicher * count(o => o.wage > w.wage) : 0)
    + (has('xenophobe') && others.some(o => o.e.nationality !== e.nationality) ? TRAIT.xenophobeForeign : 0)
    + (others.some(o => owns(o.e, 'comic')) ? TRAIT.comicCoworker : 0)
    + TRAIT.foremanPerCoworker * count(o => owns(o.e, 'foreman'))
    + TRAIT.bullyPerCoworker * count(o => owns(o.e, 'bully'))

  const cramped = p.c.storageLevel < TRAIT.claustrophobeStorage
  const days = Math.min(specDays, w.days)
  const moved = p.c.id !== w.e.company && days > 1
  const moving = moved
    ? ((w.movePenalty ? TRAIT.movedHappy * Math.min(TRAIT.movedDays, days) : 0)
      + (has('creatureOfHabit') ? TRAIT.creatureOfHabit * Math.min(TRAIT.creatureOfHabitDays, days) : 0)) / days
    : 0

  return {
    manager: p.managerPct,
    place: p.regionPct + (cramped && has('claustrophobe') ? TRAIT.claustrophobe : 0),
    specialization: avgSpec(e.specializations?.[p.c.itemCode] ?? 0, days),
    tool: tool > 0
      ? tool + (has('handy') ? TRAIT.handyWithTool : 0)
      : has('improviser') ? TRAIT.improviserWithoutTool : 0,
    coworkers,
    happiness: Math.max(-TRAIT.happinessCap, Math.min(TRAIT.happinessCap, happy)),
    moving,
  }
}

/**
 * Gold a worker makes over the horizon at a place, before wages (which don't
 * depend on the place).
 */
function goldAt(w: Worker, p: Place, team: Worker[]): number {
  return HOURS_PER_DAY * w.days * w.base * p.vpp * (1 + (w.fixedPct + sumParts(partsAt(w, p, team))) / 100)
}

function teamGold(p: Place, team: Worker[]): number {
  return team.reduce((s, w) => s + goldAt(w, p, team), 0)
}

/**
 * Whether moving costs happiness for this owner: yes, unless a worker moved in
 * the last week shows no such cost.
 */
function movePenaltyApplies(input: AdvisorInput): boolean {
  const week = TRAIT.movedDays * HOURS_PER_DAY * 3600_000
  const recent = input.companies.flatMap(c => c.employees)
    .filter(e => e.lastMovedAt && Date.now() - Date.parse(e.lastMovedAt) < week)

  return recent.every(e => e.happinessBreakdown?.contributions?.some(x => x.reason === 'recentlyMoved'))
}

/**
 * Builds the places and workers. Happiness the rules recompute is taken out
 * of what goes along, so only today's other reasons travel.
 */
function setup(input: AdvisorInput, vppByItem: Map<string, number>) {
  const movePenalty = movePenaltyApplies(input)
  const places: Place[] = input.companies.map((c) => {
    const working = c.employees.filter(e => !e.companyDisabled)
    const first = working[0]

    return {
      c,
      vpp: vppByItem.get(c.itemCode) ?? input.ppValue,
      managerPct: first ? bonusPct(first, 'manager') : c.manager?.productionBonusPercent ?? 0,
      regionPct: first ? bonusPct(first, 'coreRegion') : 0,
      idle: c.employees.length - working.length,
    }
  })

  const teams: Worker[][] = places.map((p, home) => p.c.employees.filter(e => !e.companyDisabled).map((e) => {
    const hb = e.happinessBreakdown
    let happyPct = (hb?.base ?? 50) - 50 + (hb?.mitigated ?? 0)
    let regionTraits = 0
    const itemTraits: Worker['itemTraits'] = []
    for (const x of hb?.contributions ?? []) {
      if (x.code && TEAM_HAPPY_CODES.has(x.code)) {
        continue
      }

      if (x.reason === 'trait' && x.code && ITEM_TRAITS.has(x.code)) {
        itemTraits.push({ item: e.traits?.find(t => t.code === x.code)?.arg, delta: x.delta })
        continue
      }

      if (x.reason === 'trait' && x.code && REGION_TRAITS.has(x.code)) {
        regionTraits += x.delta
        continue
      }

      happyPct += x.delta
    }

    return {
      e,
      home,
      base: basePerHour(e),
      days: payingDays(e),
      wage: e.estimate?.wage ?? e.wage ?? 0,
      fixedPct: 0,
      happyPct,
      itemTraits,
      regionTraits,
      homeRegion: p.c.regionId,
      movePenalty,
    }
  }))

  // The rest of today's bonus goes along, so today's total is reproduced exactly.
  teams.forEach((team, k) => {
    for (const w of team) {
      w.fixedPct = (w.e.productionBonus?.total ?? 0) - sumParts(partsAt(w, places[k], team, 1))
    }
  })

  return { places, workers: teams.flat(), teams }
}

/**
 * Today's bonus parts as the game shows them next to the model's, so
 * `check-advisor` catches a trait rule that changed.
 */
export function placementCheck(input: AdvisorInput) {
  const { places, teams } = setup(input, new Map())

  return teams.flatMap((team, k) => team.map((w) => {
    const game = Object.values(PART_SOURCES).flat().reduce((s, src) => s + bonusPct(w.e, src), 0)

    return { name: w.e.name, ours: sumParts(partsAt(w, places[k], team, 1)), game }
  }))
}

/**
 * Greedy best swap, again and again: a worker for a worker, or for an empty
 * slot, between two companies, until no swap adds MIN_SWAP_GAIN.
 */
function optimize(places: Place[], teams: Worker[][]): Worker[][] {
  const final = teams.map(t => [...t])
  const gold = final.map((t, k) => teamGold(places[k], t))
  const room = (k: number) => places[k].c.employeeCap - places[k].idle - final[k].length > 0

  for (let round = 0; round < 500; round++) {
    let best: { a: number, b: number, ta: Worker[], tb: Worker[], ga: number, gb: number, gain: number } | null = null
    for (let a = 0; a < places.length; a++) {
      for (let b = a + 1; b < places.length; b++) {
        const xs: (Worker | null)[] = [...final[a], ...room(a) ? [null] : []]
        const ys: (Worker | null)[] = [...final[b], ...room(b) ? [null] : []]
        for (const x of xs) {
          for (const y of ys) {
            if (!x && !y) {
              continue
            }

            const ta = [...final[a].filter(w => w !== x), ...y ? [y] : []]
            const tb = [...final[b].filter(w => w !== y), ...x ? [x] : []]
            const ga = teamGold(places[a], ta)
            const gb = teamGold(places[b], tb)
            const gain = ga + gb - gold[a] - gold[b]
            if (!best || gain > best.gain) {
              best = { a, b, ta, tb, ga, gb, gain }
            }
          }
        }
      }
    }

    if (!best || best.gain < MIN_SWAP_GAIN) {
      break
    }

    final[best.a] = best.ta
    final[best.b] = best.tb
    gold[best.a] = best.ga
    gold[best.b] = best.gb
  }

  return final
}

function joinNames(names: string[]): string {
  return names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names.at(-1)}` : names[0] ?? ''
}

function title(moves: Move[], companies: Place[]): Pick<TodoItem, 'title' | 'titleParts'> {
  if (moves.length === 1) {
    const [{ w, from, to }] = moves
    const lead = `Move ${firstName(w.e.name)} from `

    return {
      title: `${lead}${from.c.name} to ${to.c.name}`,
      titleParts: [lead, companyRef(from.c), ' to ', companyRef(to.c)],
    }
  }

  const [a, b] = moves
  if (moves.length === 2 && a.from === b.to && a.to === b.from) {
    const lead = `Swap ${firstName(a.w.e.name)} at `
    const mid = ` with ${firstName(b.w.e.name)} at `

    return {
      title: `${lead}${a.from.c.name}${mid}${b.from.c.name}`,
      titleParts: [lead, companyRef(a.from.c), mid, companyRef(b.from.c)],
    }
  }

  const lead = `Move ${moves.length} workers between `
  const parts: TitlePart[] = [lead]
  companies.forEach((p, i) => {
    if (i > 0) {
      parts.push(i === companies.length - 1 ? ' and ' : ', ')
    }

    parts.push(companyRef(p.c))
  })

  return { title: `${lead}${joinNames(companies.map(p => p.c.name))}`, titleParts: parts }
}

/**
 * One row per group of moves that share companies, so rows can be done in any
 * order and each row's gain is exact. A row names every worker's final company.
 *
 * Returns the companies as they are after every move, for the advice that
 * builds on the new teams.
 */
export function moveItems(input: AdvisorInput, vppByItem: Map<string, number>): {
  items: TodoItem[]
  companies: AdvisorCompany[]
} {
  const { places, workers, teams } = setup(input, vppByItem)
  const final = optimize(places, teams)
  const placeOf = new Map<Worker, number>()
  final.forEach((team, k) => team.forEach(w => placeOf.set(w, k)))

  const moved = workers.filter(w => placeOf.get(w) !== w.home)
  const group = places.map((_, k) => k)
  const root = (k: number): number => (group[k] === k ? k : (group[k] = root(group[k])))
  for (const w of moved) {
    group[root(w.home)] = root(placeOf.get(w)!)
  }

  const groups = new Map<number, number[]>()
  places.forEach((_, k) => {
    if (moved.some(w => w.home === k || placeOf.get(w) === k)) {
      groups.set(root(k), [...groups.get(root(k)) ?? [], k])
    }
  })

  const horizon = RULES.horizonDays
  const items: TodoItem[] = []
  for (const ks of groups.values()) {
    const moves: Move[] = moved
      .filter(w => ks.includes(w.home))
      .map(w => ({ w, from: places[w.home], to: places[placeOf.get(w)!] }))
      .sort((x, y) => x.w.home - y.w.home)

    // Splits the gain over what drives it: new value per point first, then each bonus part.
    const drivers = Object.fromEntries(['value', ...PARTS].map(k => [k, 0])) as Record<Part | 'value', number>
    let settling = 0
    for (const k of ks) {
      for (const w of teams[k]) {
        const [from, to] = [places[k], places[placeOf.get(w)!]]
        const before = partsAt(w, from, teams[k])
        const after = partsAt(w, to, final[placeOf.get(w)!])
        const scale = HOURS_PER_DAY * w.days * w.base
        drivers.value += scale * (1 + (w.fixedPct + sumParts(before)) / 100) * (to.vpp - from.vpp)
        for (const part of PARTS) {
          drivers[part] += scale * to.vpp * (after[part] - before[part]) / 100
        }

        if (from !== to) {
          const kept = avgSpec(w.e.specializations?.[from.c.itemCode] ?? 0, w.days)
          settling += scale * to.vpp * Math.max(0, kept - after.specialization) / 100
        }
      }
    }

    // The move's own cost joins the specialization that regrows, as one settling-in figure.
    settling -= drivers.moving
    const gain = ks.reduce((s, k) => s + teamGold(places[k], final[k]) - teamGold(places[k], teams[k]), 0)
    const ranked = (Object.keys(drivers) as (keyof typeof drivers)[])
      .filter(k => k !== 'moving')
      .filter(k => Math.abs(drivers[k]) / horizon >= 0.01)
      .sort((x, y) => drivers[y] - drivers[x])

    const top = ranked.filter(k => drivers[k] > 0).slice(0, 2)
    const perDay = (gold: number) => `${signedFmt(gold / horizon)} g/day`

    const facts: Fact[] = [
      ...moves.map(m => ({
        label: m.w.e.name,
        value: `${m.from.c.name} → ${m.to.c.name}`,
        brief: moves.length > 2 ? `${firstName(m.w.e.name)} → ${m.to.c.name}` : undefined,
      })),
      ...ranked.map(k => ({
        label: DRIVER_LABEL[k],
        value: perDay(drivers[k]),
        brief: moves.length <= 2 && top.includes(k)
          ? `${DRIVER_LABEL[k].toLowerCase()} ${perDay(drivers[k])}`
          : undefined,
      })),
      ...settling >= 0.01 ? [{ label: 'Settling in', value: `${fmt(settling)} g over ${horizon} days` }] : [],
    ]

    const companies = ks.map(k => places[k])
    items.push({
      id: `move-${moves.map(m => m.w.e._id).join('-')}`,
      kind: 'move',
      ...title(moves, companies),
      why: [
        `Adds ${fmt(gain)} gold over ${horizon} days`,
        settling >= 0.01 ? `, after ${fmt(settling)} lost while they settle in` : '',
        top.length ? `, mostly from ${joinNames(top.map(k => DRIVER_LABEL[k].toLowerCase()))}.` : '.',
        ' In Workforce, press Reorganize, drag each worker to the company named, then Apply.',
      ].join(''),
      facts,
      gainPerDay: gain / horizon,
    })
  }

  const companies = places.map((p, k) => ({
    ...p.c,
    employees: [...p.c.employees.filter(e => e.companyDisabled), ...final[k].map(w => w.e)],
  }))

  return { items, companies }
}
