import type { EmployeeLike } from './model'
import type { ItemPrices, RecipeLookup } from '@/lib/factories/profit'

/**
 * One number behind an action: a line of its breakdown, and optionally a
 * phrase on the row's short summary.
 */
export interface Fact {
  label: string
  value: string

  /**
   * Shown on the row itself; facts without one only appear in the breakdown.
   */
  brief?: string

  /**
   * Item code whose icon goes before the value.
   */
  icon?: string
}

/**
 * A company as a row names it; the page shows it styled, with a hover card.
 */
export interface CompanyRef {
  id: string
  name: string
  itemCode: string
  workers: number
}

/**
 * One row of the to-do list.
 */
export interface TodoItem {
  id: string
  kind: 'money' | 'train' | 'tool' | 'manager' | 'employee' | 'item' | 'hire' | 'work'
  title: string

  /**
   * The title with its company kept apart, so the page can style the name.
   */
  titleParts?: (string | CompanyRef)[]
  why: string
  facts?: Fact[]

  /**
   * Gold per day the action adds; null when it can't be priced.
   */
  gainPerDay: number | null

  /**
   * Energy the action takes; none when absent.
   */
  energy?: number

  /**
   * Set on actions repeated per company or worker, so the page can fold them
   * into one row; `short` names this one inside that row.
   */
  group?: { key: 'manager-job' | 'tool-move', short: string, company?: CompanyRef }

  /**
   * Set on an item switch, so the page can show it with item icons.
   */
  switch?: { company: CompanyRef, from: string, to: string }
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

  /**
   * The name as the player typed it, often just a number.
   */
  ownName: string
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

  energy: Bar
  cash: number | null

  /**
   * Average hourly wage of a manager job on the market.
   */
  managerMarketWage: number | null

  /**
   * Concrete it takes to change what a company makes.
   */
  changeItemConcrete: number
}

export interface AdvisorResult {
  items: TodoItem[]
  skipped: SkippedItem[]
  energy: Bar & { hoursToFull: number }
}
