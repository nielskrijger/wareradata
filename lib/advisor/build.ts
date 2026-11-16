import type { CardKind, EmployeeLike } from './model'
import type { ItemPrices, RecipeLookup } from '@/lib/factories/profit'

import { humanizeItem } from '@/components/factories/format'
import { netPerUnit } from '@/lib/factories/profit'
import {
  basePerHour,
  canTrain,
  cardGainsPerDay,
  effectiveManagerPct,
  employeeNetPerDay,
  HOURS_PER_DAY,
  hoursCovered,
  hoursToFull,
  managerNetPerDay,
  payingDays,
  RULES,
} from './model'

export type TodoKind = 'money' | 'train' | 'tool' | 'manager' | 'employee' | 'item' | 'hire' | 'work'

/**
 * One row of the to-do list.
 */
export interface TodoItem {
  id: string
  kind: TodoKind
  title: string
  why: string

  /**
   * Gold per day the action adds; null when it can't be priced.
   */
  gainPerDay: number | null
  energy: number
  confidence: 'high' | 'medium' | 'low'

  /**
   * Pinned above everything else.
   */
  urgent?: boolean

  /**
   * Set while the game won't allow the action yet.
   */
  lockedUntil?: string
}

/**
 * An action looked at and left out, with the reason.
 */
export interface SkippedItem {
  title: string
  why: string
}

export interface Bar {
  current: number
  cap: number
  regenPerHour: number
}

/**
 * A company with what the advisor needs about it.
 */
export interface AdvisorCompany {
  id: string
  name: string
  itemCode: string
  employeeCap: number
  enginePointsPerDay: number
  employees: EmployeeLike[]
  manager: { hourlyWage: number, productionBonusPercent: number, canEndAt: string } | null
}

export interface AdvisorInput {
  companies: AdvisorCompany[]

  /**
   * Gold value of a production point the game prices wages with.
   */
  ppValue: number
  prices: ItemPrices
  recipe: RecipeLookup

  /**
   * The owner's Management bonus in percent.
   */
  ownerManagementPct: number
  energy: Bar
  production: Bar
  cash: number | null

  /**
   * Average hourly wage of a manager job on the market.
   */
  managerMarketWage: number | null
  changeItemCost: number
  now: Date
}

export interface AdvisorResult {
  items: TodoItem[]
  skipped: SkippedItem[]
  energy: Bar & { hoursToFull: number }
  hourlyCost: number
  hoursCovered: number | null
}

/**
 * Gains below this are noise next to daily price moves.
 */
const MIN_GAIN_PER_DAY = 0.1

const TRAIN_ENERGY = 10
const HIRE_ENERGY = 10

/**
 * An item change must pay back its cost within this many days.
 */
const ITEM_PAYBACK_DAYS = 3

const CARD_LABEL: Record<CardKind, string> = {
  production: 'Production',
  negotiation: 'Negotiation (lower wage)',
  responsibility: 'Responsibility',
}

/**
 * Traits that help coworkers, so firing their holder costs more than their own net.
 */
const TEAM_TRAITS = new Set(['mentor', 'foreman', 'trainer', 'recruiter', 'oldFriends', 'sociable'])

const TOOL_RARITY = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic']

function firstName(name: string): string {
  return name.split(' ')[0]
}

function fmt(value: number, decimals = 2): string {
  return value.toFixed(decimals)
}

function signedFmt(value: number): string {
  return `${value >= 0 ? '+' : ''}${fmt(value)}`
}

function toolLabel(code: string): string {
  const m = /^([a-z]+)(\d)$/i.exec(code)

  return m ? `${TOOL_RARITY[Number(m[2]) - 1] ?? ''} ${m[1]}`.trim() : code
}

/**
 * Net gold per production point of an item; null when a price is missing.
 */
export function valuePerPoint(code: string, prices: ItemPrices, recipe: RecipeLookup): number | null {
  const unit = netPerUnit(code, prices, recipe)
  const points = recipe[code]?.productionPoints

  return unit == null || !points ? null : unit / points
}

function specializationPct(e: EmployeeLike): number {
  return e.productionBonus?.contributions?.find(c => c.source === 'specialization')?.percent ?? 0
}

function toolPct(e: EmployeeLike): number {
  const s = e.toolStatus

  return s && s.isUsable && !s.isBroken ? s.bonusPercent : 0
}

function moneyItem(input: AdvisorInput, hourlyCost: number): TodoItem | null {
  if (input.cash == null || hourlyCost <= 0) {
    return null
  }

  const hours = hoursCovered(input.cash, hourlyCost)
  if (hours >= HOURS_PER_DAY) {
    return null
  }

  const short = hourlyCost * HOURS_PER_DAY - input.cash

  return {
    id: 'money',
    kind: 'money',
    title: `Add ${fmt(short, 1)} gold: wages run out in ${fmt(hours, 1)} h`,
    why: `Wages and managers cost ${fmt(hourlyCost)} an hour and you hold ${fmt(input.cash, 1)}. An hour that can't be paid in full stops that company for the hour.`,
    gainPerDay: null,
    energy: 0,
    confidence: 'high',
    urgent: true,
  }
}

function trainingItems(input: AdvisorInput, c: AdvisorCompany, vpp: number, skipped: SkippedItem[]): TodoItem[] {
  const items: TodoItem[] = []

  for (const e of c.employees) {
    if (!canTrain(e)) {
      continue
    }

    const days = payingDays(e)
    const gains = cardGainsPerDay(e, vpp, input.ppValue)
    const ranked = (Object.keys(gains) as CardKind[]).sort((a, b) => gains[b] - gains[a])
    const best = ranked[0]
    if (days <= 1 || gains[best] * days < MIN_GAIN_PER_DAY) {
      skipped.push({
        title: `Training ${firstName(e.name)}`,
        why: days <= 1 ? `Retires in ${e.retireInDays} days.` : 'No common card pays for itself.',
      })

      continue
    }

    const draws = Math.min(e.potential ?? 0, (e.trainingsPerDay ?? 1) - (e.trainingsToday ?? 0))
    const perCard = ranked.map(k => `${CARD_LABEL[k].split(' ')[0]} ${signedFmt(gains[k])}`).join(', ')
    items.push({
      id: `train-${e._id}`,
      kind: 'train',
      title: `Train ${firstName(e.name)} (${c.name}): pick ${CARD_LABEL[best]}`,
      why: `Per day: ${perCard}. Pays for ${days} days.`,
      gainPerDay: gains[best] * draws,
      energy: TRAIN_ENERGY * draws,
      confidence: 'medium',
    })
  }

  return items
}

function fireItems(c: AdvisorCompany, vpp: number): TodoItem[] {
  const items: TodoItem[] = []

  for (const e of c.employees) {
    const net = employeeNetPerDay(e, vpp)
    if (net > -MIN_GAIN_PER_DAY || e.companyDisabled) {
      continue
    }

    const helpsTeam = (e.traits ?? []).some(t => TEAM_TRAITS.has(t.code))
    const leanedOn = c.employees.some(o => o._id !== e._id && (o.traits ?? []).some(t => t.arg === e._id))
    items.push({
      id: `fire-${e._id}`,
      kind: 'employee',
      title: `Fire ${firstName(e.name)} (${c.name})`,
      why: `Their output is worth ${fmt(HOURS_PER_DAY * (e.estimate?.production ?? 0) * vpp)} a day and they cost ${fmt(HOURS_PER_DAY * (e.estimate?.wage ?? 0))} in wages.${helpsTeam || leanedOn ? ' A trait links them to coworkers, so check those first.' : ''}`,
      gainPerDay: -net,
      energy: 0,
      confidence: helpsTeam || leanedOn ? 'low' : 'high',
    })
  }

  return items
}

function managerItems(input: AdvisorInput, c: AdvisorCompany, vpp: number): TodoItem[] {
  const working = c.employees.filter(e => !e.companyDisabled)
  const baseSum = working.reduce((s, e) => s + basePerHour(e), 0)
  const ownerPct = working[0]?.productionBonus?.contributions?.find(x => x.source === 'management')?.percent
    ?? input.ownerManagementPct

  if (c.manager) {
    const m = c.manager
    const net = managerNetPerDay({
      basePerHourSum: baseSum,
      managerPct: m.productionBonusPercent,
      ownerPct,
      hourlyWage: m.hourlyWage,
      valuePerPoint: vpp,
    })

    const counted = effectiveManagerPct(m.productionBonusPercent, ownerPct)
    const locked = new Date(m.canEndAt) > input.now ? m.canEndAt : undefined
    if (net < -MIN_GAIN_PER_DAY) {
      return [{
        id: `fire-manager-${c.id}`,
        kind: 'manager',
        title: `Fire the manager at ${c.name}`,
        why: `Their +${counted}% adds ${fmt(net + HOURS_PER_DAY * m.hourlyWage)} a day of output for ${fmt(HOURS_PER_DAY * m.hourlyWage)} in wages. Leaves out their daily +5 happiness care.`,
        gainPerDay: -net,
        energy: 0,
        confidence: 'high',
        lockedUntil: locked,
      }]
    }

    const wasted = HOURS_PER_DAY * m.hourlyWage * (1 - counted / m.productionBonusPercent)
    if (wasted >= MIN_GAIN_PER_DAY) {
      return [{
        id: `manager-cap-${c.id}`,
        kind: 'manager',
        title: `Manager at ${c.name} is past the Management cap`,
        why: `Only ${counted}% of their ${m.productionBonusPercent}% counts with your own +${ownerPct}%. A manager with fewer points would cost less for the same output.`,
        gainPerDay: wasted,
        energy: 0,
        confidence: 'medium',
      }]
    }

    return []
  }

  if (!working.length || input.managerMarketWage == null) {
    return []
  }

  const pct = effectiveManagerPct(RULES.managerCapPct, ownerPct)
  const net = managerNetPerDay({
    basePerHourSum: baseSum,
    managerPct: pct,
    ownerPct,
    hourlyWage: input.managerMarketWage,
    valuePerPoint: vpp,
  })

  if (net < MIN_GAIN_PER_DAY) {
    return []
  }

  return [{
    id: `hire-manager-${c.id}`,
    kind: 'manager',
    title: `Post a manager job at ${c.name}`,
    why: `A manager with ${pct / RULES.managementPctPerPoint} Management adds +${pct}% here. At the market's ${fmt(input.managerMarketWage, 3)} an hour that nets this much a day.`,
    gainPerDay: net,
    energy: 0,
    confidence: 'medium',
  }]
}

/**
 * Greedy pairwise swaps: a stronger tool belongs on the employee with more base output.
 */
function toolItems(input: AdvisorInput, vppByItem: Map<string, number>): TodoItem[] {
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
      items.push({
        id: `tool-${from.e._id}-${to.e._id}`,
        kind: 'tool',
        title: to.pct > 0
          ? `Swap tools: ${firstName(from.e.name)}'s ${tool} (+${from.pct}%) to ${firstName(to.e.name)}, theirs back`
          : `Move ${firstName(from.e.name)}'s ${tool} (+${from.pct}%) to ${firstName(to.e.name)} (${to.company})`,
        why: `${firstName(to.e.name)} has ${fmt(basePerHour(to.e))} base points an hour against ${fmt(basePerHour(from.e))}, and a tool adds a percent of base output.`,
        gainPerDay: HOURS_PER_DAY * (best.gain / 100) * vpp,
        energy: 0,
        confidence: 'high',
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

function itemSwitchItem(
  input: AdvisorInput,
  c: AdvisorCompany,
  vppByItem: Map<string, number>,
): { item: TodoItem, vpp: number } | null {
  const current = vppByItem.get(c.itemCode)
  if (current == null) {
    return null
  }

  const working = c.employees.filter(e => !e.companyDisabled)
  const employeePoints = working.reduce((s, e) => s + HOURS_PER_DAY * (e.estimate?.production ?? 0), 0)
  const pointsNow = c.enginePointsPerDay + employeePoints

  let best: { code: string, gain: number, specFrom: number, specTo: number } | null = null
  for (const [code, vpp] of vppByItem) {
    if (code === c.itemCode || vpp <= current) {
      continue
    }

    let specLoss = 0
    let specFrom = 0
    let specTo = 0
    for (const e of working) {
      const from = specializationPct(e)
      const to = Math.min(e.specializations?.[code] ?? 0, RULES.specializationCapPct)
      specLoss += HOURS_PER_DAY * basePerHour(e) * (from - to) / 100
      specFrom += from
      specTo += to
    }

    const gain = (pointsNow - specLoss) * vpp - pointsNow * current
    if (!best || gain > best.gain) {
      best = { code, gain, specFrom, specTo }
    }
  }

  if (!best || best.gain * ITEM_PAYBACK_DAYS <= input.changeItemCost) {
    return null
  }

  const n = working.length || 1
  const hasTools = working.some(e => toolPct(e) > 0)

  const item: TodoItem = {
    id: `item-${c.id}`,
    kind: 'item',
    title: `Switch ${c.name} from ${humanizeItem(c.itemCode)} to ${humanizeItem(best.code)}`,
    why: `${humanizeItem(best.code)} nets ${fmt(vppByItem.get(best.code) ?? 0, 3)} a point against ${fmt(current, 3)}. Specialization goes from ${fmt(best.specFrom / n, 0)}% to ${fmt(best.specTo / n, 0)}% on average; costs ${input.changeItemCost} gold.${hasTools ? ' Check the tools fit the new item.' : ''}`,
    gainPerDay: best.gain,
    energy: 0,
    confidence: 'medium',
  }

  return { item, vpp: vppByItem.get(best.code) ?? current }
}

function hireItem(c: AdvisorCompany, medianNet: number | null): TodoItem | null {
  const open = c.employeeCap - c.employees.length
  if (open <= 0) {
    return null
  }

  return {
    id: `hire-${c.id}`,
    kind: 'hire',
    title: `Hire into ${open === 1 ? 'the empty slot' : `${open} empty slots`} at ${c.name}`,
    why: 'Pick the candidate with the lowest wage per Production. Trait and potential show after hiring, and a new hire can be fired for free after 12 hours.',
    gainPerDay: medianNet,
    energy: HIRE_ENERGY,
    confidence: 'low',
  }
}

function median(values: number[]): number | null {
  if (!values.length) {
    return null
  }

  const s = [...values].sort((a, b) => a - b)

  return s[Math.floor(s.length / 2)]
}

/**
 * Builds the ranked to-do list from the owner's companies, employees and bars.
 */
export function buildAdvice(input: AdvisorInput): AdvisorResult {
  const vppByItem = new Map<string, number>()
  for (const code of Object.keys(input.recipe)) {
    const v = valuePerPoint(code, input.prices, input.recipe)
    if (v != null) {
      vppByItem.set(code, v)
    }
  }

  const skipped: SkippedItem[] = []
  const items: TodoItem[] = []
  let hourlyCost = 0
  const nets: number[] = []

  for (const c of input.companies) {
    const vpp = vppByItem.get(c.itemCode) ?? input.ppValue
    for (const e of c.employees) {
      if (!e.companyDisabled) {
        hourlyCost += e.estimate?.wage ?? e.wage ?? 0
        nets.push(employeeNetPerDay(e, vpp))
      }
    }

    hourlyCost += c.manager?.hourlyWage ?? 0
    const sw = itemSwitchItem(input, c, vppByItem)
    if (sw) {
      items.push(sw.item)
    }

    // Staff are judged on the item the company should make.
    const staffVpp = sw?.vpp ?? vpp
    items.push(...trainingItems(input, c, staffVpp, skipped))
    items.push(...fireItems(c, staffVpp))
    items.push(...managerItems(input, c, staffVpp))
  }

  items.push(...toolItems(input, vppByItem))
  const medianNet = median(nets)
  for (const c of input.companies) {
    const h = hireItem(c, medianNet)
    if (h) {
      items.push(h)
    }
  }

  const energyHours = hoursToFull(input.energy.current, input.energy.cap, input.energy.regenPerHour)
  const planned = items.reduce((s, i) => s + i.energy, 0)
  const spare = input.energy.current - planned
  if (spare >= TRAIN_ENERGY && energyHours < HOURS_PER_DAY) {
    items.push({
      id: 'work',
      kind: 'work',
      title: 'Work in your own companies with the spare energy',
      why: `Energy is full in ${fmt(energyHours, 1)} h, after which regeneration is lost. Self-work also uses your production bar (${fmt(input.production.current, 0)} of ${input.production.cap}).`,
      gainPerDay: null,
      energy: Math.floor(spare / TRAIN_ENERGY) * TRAIN_ENERGY,
      confidence: 'low',
    })
  }

  const money = moneyItem(input, hourlyCost)
  const ranked = items.sort((a, b) => (b.gainPerDay ?? -1) - (a.gainPerDay ?? -1))

  return {
    items: money ? [money, ...ranked] : ranked,
    skipped,
    energy: { ...input.energy, hoursToFull: energyHours },
    hourlyCost,
    hoursCovered: input.cash == null ? null : hoursCovered(input.cash, hourlyCost),
  }
}
