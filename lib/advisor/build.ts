import type { AdvisorInput, AdvisorResult, SkippedItem, TodoItem } from './types'

import { itemSwitchItem } from './items/item-switch'
import { managerItems } from './items/manager'
import { moneyItem } from './items/money'
import { moveItems } from './items/moves'
import { fireItems, hireItem } from './items/staff'
import { toolItems } from './items/tools'
import { TRAIN_ENERGY, trainingItems } from './items/training'
import { employeeNetPerDay, HOURS_PER_DAY } from './model'
import { fmt, valuePerPoint } from './shared'

function median(values: number[]): number | null {
  if (!values.length) {
    return null
  }

  const s = [...values].sort((a, b) => a - b)

  return s[Math.floor(s.length / 2)]
}

/**
 * Builds the ranked to-do list from the owner's companies, employees and bars.
 *
 * Each kind of suggestion lives in `items/`. Items sort by gold per day, with the
 * cash warning always first.
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
  const nets: number[] = []

  // Tools, managers and hiring build on the teams after the moves.
  const moves = moveItems(input, vppByItem)
  const items: TodoItem[] = [...moves.items]

  input.companies.forEach((c, i) => {
    const vpp = vppByItem.get(c.itemCode) ?? input.ppValue
    for (const e of c.employees) {
      if (!e.companyDisabled) {
        nets.push(employeeNetPerDay(e, vpp))
      }
    }

    const sw = itemSwitchItem(input, c, vppByItem)
    if (sw) {
      items.push(sw.item)
    }

    // Staff are judged on the item the company should make.
    const staffVpp = sw?.vpp ?? vpp
    items.push(...trainingItems(input, c, staffVpp, skipped))
    items.push(...fireItems(c, staffVpp))
    items.push(...managerItems(input, moves.companies[i], staffVpp, skipped))
  })

  items.push(...toolItems({ ...input, companies: moves.companies }, vppByItem))
  const medianNet = median(nets)
  for (const c of moves.companies) {
    const h = hireItem(c, medianNet)
    if (h) {
      items.push(h)
    }
  }

  const { current, cap, regenPerHour } = input.energy
  const energyHours = regenPerHour > 0 ? Math.max(0, (cap - current) / regenPerHour) : Number.POSITIVE_INFINITY
  const planned = items.reduce((s, i) => s + (i.energy ?? 0), 0)
  const spare = input.energy.current - planned
  if (spare >= TRAIN_ENERGY && energyHours < HOURS_PER_DAY) {
    items.push({
      id: 'work',
      kind: 'work',
      title: 'Work in your own companies with the spare energy',
      why: `Energy is full in ${fmt(energyHours, 1)} h, after which regeneration is lost.`,
      gainPerDay: null,
      energy: Math.floor(spare / TRAIN_ENERGY) * TRAIN_ENERGY,
    })
  }

  const total = (key: 'outputPerDay' | 'engineOutputPerDay' | 'payrollPerDay' | 'toolboxesPerDay') =>
    input.companies.reduce((s, c) => s + c[key], 0)

  const summary = {
    outputPerDay: total('outputPerDay'),
    engineOutputPerDay: total('engineOutputPerDay'),
    payrollPerDay: total('payrollPerDay'),
    netPerDay: total('outputPerDay') - total('payrollPerDay'),
    stepsPerDay: items.reduce((s, i) => s + (i.gainPerDay ?? 0), 0),
    toolboxesPerDay: total('toolboxesPerDay'),
  }

  const money = moneyItem(input, summary.payrollPerDay / HOURS_PER_DAY)
  const ranked = items.sort((a, b) => (b.gainPerDay ?? -1) - (a.gainPerDay ?? -1))

  return {
    summary,
    items: money ? [money, ...ranked] : ranked,
    skipped,
    energy: { ...input.energy, hoursToFull: energyHours },
  }
}
