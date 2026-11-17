import type { AdvisorInput, AdvisorResult, SkippedItem, TodoItem } from './types'

import { managerItems } from './items/manager'
import { moneyItem } from './items/money'
import { planItems } from './items/plan'
import { fireItems, hireItem } from './items/staff'
import { TRAIN_ENERGY, trainingItems } from './items/training'
import { employeeNetPerDay, HOURS_PER_DAY } from './model'
import { fmt, valuePerPoint } from './shared'
import { buildWorld } from './sim/world'

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

  // Staff, managers and hiring are judged on the plan's teams and items.
  const world = buildWorld(input, vppByItem)
  const planned = planItems(input, world)
  const items: TodoItem[] = [...planned.items]

  input.companies.forEach((c, k) => {
    const vpp = vppByItem.get(c.itemCode) ?? input.ppValue
    for (const e of c.employees) {
      if (!e.companyDisabled) {
        nets.push(employeeNetPerDay(e, vpp))
      }
    }

    const after = planned.companies[k]
    const staffVpp = vppByItem.get(after.itemCode) ?? vpp
    items.push(...trainingItems(input, after, staffVpp, skipped))
    items.push(...fireItems(after, staffVpp))
    items.push(...managerItems(input, world, planned.plan, k, skipped))
  })

  const medianNet = median(nets)
  for (const c of planned.companies) {
    const h = hireItem(c, medianNet)
    if (h) {
      items.push(h)
    }
  }

  const { current, cap, regenPerHour } = input.energy
  const energyHours = regenPerHour > 0 ? Math.max(0, (cap - current) / regenPerHour) : Number.POSITIVE_INFINITY
  const energyUsed = items.reduce((s, i) => s + (i.energy ?? 0), 0)
  const spare = input.energy.current - energyUsed
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
