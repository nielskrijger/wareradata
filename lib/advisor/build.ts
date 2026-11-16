import type { AdvisorInput, AdvisorResult, SkippedItem, TodoItem } from './types'

import { itemSwitchItem } from './items/item-switch'
import { managerItems } from './items/manager'
import { moneyItem } from './items/money'
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

  const money = moneyItem(input, hourlyCost)
  const ranked = items.sort((a, b) => (b.gainPerDay ?? -1) - (a.gainPerDay ?? -1))

  return {
    items: money ? [money, ...ranked] : ranked,
    skipped,
    energy: { ...input.energy, hoursToFull: energyHours },
  }
}
