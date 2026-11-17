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

export type TitlePart = string | CompanyRef | { item: string }

/**
 * One row of the to-do list.
 */
export interface TodoItem {
  id: string
  kind: 'money' | 'train' | 'move' | 'tool' | 'manager' | 'employee' | 'item' | 'hire' | 'work'
  title: string

  /**
   * The title with companies and items kept apart, so the page can style them.
   */
  titleParts?: TitlePart[]
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
  regionId: string
  storageLevel: number
  employeeCap: number
  enginePointsPerDay: number
  employees: EmployeeLike[]
  manager: { hourlyWage: number, productionBonusPercent: number } | null

  /**
   * Today's gold a day: output after inputs, the engine's part of it, and wages plus the manager.
   */
  outputPerDay: number
  engineOutputPerDay: number
  payrollPerDay: number
  toolboxesPerDay: number
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

  /**
   * Raw goods (iron, grain…) rather than products, which some traits care about.
   */
  rawGoods: Set<string>
}

/**
 * Where the owner stands today, and after every priced step.
 */
export interface AdvisorSummary {
  outputPerDay: number
  engineOutputPerDay: number
  payrollPerDay: number
  netPerDay: number
  stepsPerDay: number
  toolboxesPerDay: number
}

export interface AdvisorResult {
  summary: AdvisorSummary
  items: TodoItem[]
  skipped: SkippedItem[]
  energy: Bar & { hoursToFull: number }
}
