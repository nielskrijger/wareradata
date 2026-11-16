import type { EmployeeLike } from './model'
import type { AdvisorCompany, CompanyRef, TodoItem } from './types'
import type { ItemPrices, RecipeLookup } from '@/lib/factories/profit'

import { netPerUnit } from '@/lib/factories/profit'

/**
 * Gains below this are noise next to daily price moves.
 */
export const MIN_GAIN_PER_DAY = 0.1

export function companyRef(c: AdvisorCompany): CompanyRef {
  return { id: c.id, name: c.ownName, itemCode: c.itemCode, workers: c.employees.length }
}

/**
 * A title naming a company, as plain text and with the company kept apart.
 */
export function titleAt(before: string, c: AdvisorCompany, after = ''): Pick<TodoItem, 'title' | 'titleParts'> {
  return { title: `${before}${c.name}${after}`, titleParts: [before, companyRef(c), after] }
}

export function firstName(name: string): string {
  return name.split(' ')[0]
}

export function fmt(value: number, decimals = 2): string {
  return value.toFixed(decimals)
}

export function signedFmt(value: number): string {
  return `${value >= 0 ? '+' : ''}${fmt(value)}`
}

/**
 * Net gold per production point of an item; null when a price is missing.
 */
export function valuePerPoint(code: string, prices: ItemPrices, recipe: RecipeLookup): number | null {
  const unit = netPerUnit(code, prices, recipe)
  const points = recipe[code]?.productionPoints

  return unit == null || !points ? null : unit / points
}

/**
 * One source's part of the production bonus, in percent.
 */
export function bonusPct(e: EmployeeLike, source: string): number {
  return e.productionBonus?.contributions?.find(c => c.source === source)?.percent ?? 0
}

export function specializationPct(e: EmployeeLike): number {
  return bonusPct(e, 'specialization')
}

/**
 * The rolled bonus of a held tool, whether or not it works on the item made.
 */
export function heldToolPct(e: EmployeeLike): number {
  return e.toolItem && !e.toolStatus?.isBroken ? e.toolStatus?.rolledPercent ?? 0 : 0
}

export function toolPct(e: EmployeeLike): number {
  const s = e.toolStatus

  return s && s.isUsable && !s.isBroken ? s.bonusPercent : 0
}
