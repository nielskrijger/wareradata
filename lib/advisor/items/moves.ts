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
 * Own happiness traits tied to the place: the item made, or the region.
 */
const ITEM_TRAITS = new Set(['specialist'])
const REGION_TRAITS = new Set(['patriot', 'nationalist', 'homesick', 'expat'])

/**
 * Traits that dislike moving, so their holders stay put.
 */
const STAY_TRAITS = new Set(['creatureOfHabit'])

/**
 * Bonus sources whose condition the API doesn't show. Each keeps today's bonus
 * while its guessed condition, measured against today's team, still holds.
 */
const TEAM_SOURCES = ['sociable', 'girlPower', 'primaDonna'] as const
type TeamSource = typeof TEAM_SOURCES[number]

/**
 * Parts of the production bonus that change with the company or the team; the
 * rest (owner Management, events, taxes, other traits) goes along unchanged.
 */
const PARTS = ['manager', 'region', 'specialization', 'tool', 'friends', 'team', 'happiness'] as const
type Part = typeof PARTS[number]
type Parts = Record<Part, number>

const DRIVER_LABEL: Record<Part | 'value', string> = {
  value: 'Value per point',
  manager: 'Manager bonus',
  region: 'Region bonus',
  specialization: 'Specialization',
  tool: 'Tools',
  friends: 'Old friends',
  team: 'Team traits',
  happiness: 'Happiness',
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
  movable: boolean
  base: number
  days: number

  /**
   * Bonus percent that goes wherever the worker goes.
   */
  fixedPct: number

  /**
   * Happiness that goes along, split by sign so a mitigating trait like Loyal applies.
   */
  happyPos: number
  happyNeg: number
  mitigation: number
  happyOffset: number
  itemTraits: { item?: string, delta: number }[]
  regionTraits: number
  homeRegion: string

  /**
   * Happiness this worker's traits give each coworker.
   */
  gives: number
  friendId: string | null
  friendPct: number
  handyPct: number
  teamPcts: Partial<Record<TeamSource, number>>
  femaleCoworkers: number
  teamSize: number
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

function production(e: EmployeeLike): number {
  return e.breakdown?.production?.total ?? 0
}

function sumParts(p: Parts): number {
  return PARTS.reduce((s, k) => s + p[k], 0)
}

/**
 * The bonus parts a worker gets at a place next to a team that includes them.
 * `specDays` averages specialization over that many days; 1 gives today's.
 */
function partsAt(w: Worker, p: Place, team: Worker[], specDays = w.days): Parts {
  const e = w.e
  const others = team.filter(o => o !== w)
  const tool = e.toolItem && toolFits(e.toolItem.code, p.c.itemCode) ? heldToolPct(e) : 0

  let pos = w.happyPos
  let neg = w.happyNeg
  const add = (delta: number) => {
    if (delta >= 0) {
      pos += delta
    } else {
      neg += delta
    }
  }

  for (const t of w.itemTraits) {
    if (t.item === p.c.itemCode) {
      add(t.delta)
    }
  }

  if (p.c.regionId === w.homeRegion) {
    add(w.regionTraits)
  }

  for (const o of others) {
    add(o.gives)
  }

  const holds: Record<TeamSource, boolean> = {
    sociable: team.length >= w.teamSize,
    girlPower: others.filter(o => o.e.gender === 'female').length >= w.femaleCoworkers,
    primaDonna: others.every(o => production(o.e) < production(e)),
  }

  return {
    manager: p.managerPct,
    region: p.regionPct,
    specialization: avgSpec(e.specializations?.[p.c.itemCode] ?? 0, Math.min(specDays, w.days)),
    tool: tool > 0 ? tool + w.handyPct : 0,
    friends: w.friendId && others.some(o => o.e._id === w.friendId) ? w.friendPct : 0,
    team: TEAM_SOURCES.reduce((s, k) => s + (holds[k] ? w.teamPcts[k] ?? 0 : 0), 0),
    happiness: w.happyOffset + pos + neg * (1 - w.mitigation),
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
 * Builds the places and workers, reading each trait's amount from today's
 * breakdowns. A trait nobody shows today counts for nothing.
 */
function setup(input: AdvisorInput, vppByItem: Map<string, number>) {
  const seenBonus = new Map<string, number>()
  const seenGiven = new Map<string, number>()
  const seenOwn = new Map<string, number>()
  for (const c of input.companies) {
    for (const e of c.employees) {
      for (const x of e.productionBonus?.contributions ?? []) {
        seenBonus.set(x.source, x.percent)
      }

      for (const x of e.happinessBreakdown?.contributions ?? []) {
        if (x.reason === 'trait' && x.code) {
          (owns(e, x.code) ? seenOwn : seenGiven).set(x.code, x.delta)
        }
      }
    }
  }

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

  const workers: Worker[] = []
  const teams: Worker[][] = places.map((p, home) => {
    const working = p.c.employees.filter(e => !e.companyDisabled)

    return working.map((e) => {
      const coworkers = working.filter(o => o !== e)
      let [pos, neg, allNeg] = [0, 0, 0]
      let regionTraits = 0
      const itemTraits: Worker['itemTraits'] = []
      for (const x of e.happinessBreakdown?.contributions ?? []) {
        allNeg += Math.min(0, x.delta)
        if (x.reason === 'trait' && x.code) {
          // Coworkers' traits and the item's are added back per place.
          if (!owns(e, x.code) || ITEM_TRAITS.has(x.code)) {
            continue
          }

          if (REGION_TRAITS.has(x.code)) {
            regionTraits += x.delta
            continue
          }
        }

        if (x.delta >= 0) {
          pos += x.delta
        } else {
          neg += x.delta
        }
      }

      for (const t of e.traits ?? []) {
        if (ITEM_TRAITS.has(t.code)) {
          const shown = e.happinessBreakdown?.contributions?.find(x => x.reason === 'trait' && x.code === t.code)
          itemTraits.push({ item: t.arg, delta: shown?.delta ?? seenOwn.get(t.code) ?? 0 })
        }
      }

      // What a trait gives coworkers shows on them, split between holders of the same trait.
      let gives = 0
      for (const t of e.traits ?? []) {
        const holders = working.filter(o => owns(o, t.code)).length
        const shown = coworkers
          .filter(o => !owns(o, t.code))
          .flatMap(o => o.happinessBreakdown?.contributions ?? [])
          .find(x => x.reason === 'trait' && x.code === t.code)

        gives += shown ? shown.delta / holders : seenGiven.get(t.code) ?? 0
      }

      const friend = e.traits?.find(t => t.code === 'oldFriends')?.arg ?? null
      const teamPcts: Worker['teamPcts'] = {}
      for (const k of TEAM_SOURCES) {
        teamPcts[k] = bonusPct(e, k)
      }

      const w: Worker = {
        e,
        home,
        movable: !(e.traits ?? []).some(t => STAY_TRAITS.has(t.code)),
        base: basePerHour(e),
        days: payingDays(e),
        fixedPct: 0,
        happyPos: pos,
        happyNeg: neg,
        mitigation: allNeg < 0 ? (e.happinessBreakdown?.mitigated ?? 0) / -allNeg : 0,
        happyOffset: (e.happinessBreakdown?.base ?? 50) - 50,
        itemTraits,
        regionTraits,
        homeRegion: p.c.regionId,
        gives,
        friendId: friend,
        friendPct: friend ? bonusPct(e, 'oldFriends') || (seenBonus.get('oldFriends') ?? 0) : 0,
        handyPct: owns(e, 'handy') ? bonusPct(e, 'handy') || (seenBonus.get('handy') ?? 0) : 0,
        teamPcts,
        femaleCoworkers: coworkers.filter(o => o.gender === 'female').length,
        teamSize: working.length,
      }

      workers.push(w)

      return w
    })
  })

  // The rest of today's bonus goes along, so today's total is reproduced exactly.
  teams.forEach((team, k) => {
    for (const w of team) {
      w.fixedPct = (w.e.productionBonus?.total ?? 0) - sumParts(partsAt(w, places[k], team, 1))
    }
  })

  return { places, workers, teams }
}

/**
 * Today's bonus parts as the game shows them next to the model's, so
 * `check-advisor` catches a trait rule that changed.
 */
export function placementCheck(input: AdvisorInput) {
  const { places, teams } = setup(input, new Map())

  return teams.flatMap((team, k) => team.map((w) => {
    const ours = partsAt(w, places[k], team, 1)
    const e = w.e
    const game = bonusPct(e, 'manager') + bonusPct(e, 'coreRegion') + bonusPct(e, 'specialization')
      + bonusPct(e, 'tool') + bonusPct(e, 'handy') + bonusPct(e, 'oldFriends') + bonusPct(e, 'happiness')
      + TEAM_SOURCES.reduce((s, src) => s + bonusPct(e, src), 0)

    return { name: e.name, ours: sumParts(ours), game }
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
        const xs: (Worker | null)[] = [...final[a].filter(w => w.movable), ...room(a) ? [null] : []]
        const ys: (Worker | null)[] = [...final[b].filter(w => w.movable), ...room(b) ? [null] : []]
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

    const gain = ks.reduce((s, k) => s + teamGold(places[k], final[k]) - teamGold(places[k], teams[k]), 0)
    const ranked = (Object.keys(drivers) as (keyof typeof drivers)[])
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
        settling >= 0.01 ? `, after ${fmt(settling)} lost while specialization on the new item grows` : '',
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
