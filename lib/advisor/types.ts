import type { EmployeeLike } from './model'
import type { ItemPrices, RecipeLookup } from '@/lib/factories/profit'

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

  /**
   * Pinned above everything else.
   */
  urgent?: boolean
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
  manager: { hourlyWage: number, productionBonusPercent: number } | null
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
  cash: number | null

  /**
   * Average hourly wage of a manager job on the market.
   */
  managerMarketWage: number | null
  changeItemCost: number
}

export interface AdvisorResult {
  items: TodoItem[]
  skipped: SkippedItem[]
  energy: Bar & { hoursToFull: number }
  hourlyCost: number
}
