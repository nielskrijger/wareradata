import type { RowData } from '@tanstack/react-table'
import type { LucideIcon } from 'lucide-react'

import type { ColumnDef, DataColumnMeta } from './features'
import {
  Building2,
  Coins,
  Factory,
  HardHat,
  Landmark,
  LayoutGrid,
  PackageOpen,
  Sparkles,
  Swords,
  Trophy,
} from 'lucide-react'

/**
 * Column categories, in table and Columns-menu order. A column's category comes
 * from the group it's declared in (see {@link buildColumns}); unstamped columns
 * fall back to General.
 */
export const CATEGORIES = [
  'points',
  'general',
  'combat',
  'government',
  'muSpecific',
  'wealth',
  'factories',
  'employees',
  'premium',
  'cases',
] as const

export type Category = (typeof CATEGORIES)[number]

interface CategoryMeta {
  label: string
  Icon: LucideIcon
  color?: string

  /**
   * Column ids the category's tab sorts by when opened, first present wins;
   * without a match the tab sorts by its first column.
   */
  sortBy?: string[]
}

/**
 * Label, icon and color per category.
 *
 * General stays colorless: a glyph on every general header would be noise, so
 * its icon shows only in the Columns menu. Government and MU-specific share
 * slate because they never appear in the same table.
 */
export const CATEGORY_META: Record<Category, CategoryMeta> = {
  points: { label: 'Points', Icon: Trophy, color: 'var(--heat-teal)', sortBy: ['totalPoints', 'points'] },
  general: { label: 'General', Icon: LayoutGrid },
  combat: { label: 'Combat', Icon: Swords, color: 'var(--heat-red)', sortBy: ['weeklyDamage'] },
  government: { label: 'Government', Icon: Landmark, color: 'var(--heat-slate-text)', sortBy: ['development'] },
  muSpecific: { label: 'MU-specific', Icon: Building2, color: 'var(--heat-slate-text)', sortBy: ['reputation'] },
  wealth: {
    label: 'Wealth',
    Icon: Coins,
    color: 'var(--heat-gold)',
    sortBy: ['memberWealth', 'citizenWealth', 'wealthRank'],
  },
  factories: { label: 'Factories', Icon: Factory, color: 'var(--heat-orange)', sortBy: ['factoryNetPerDay'] },
  employees: { label: 'Employees', Icon: HardHat, color: 'var(--heat-blue)', sortBy: ['factoryWorkers'] },
  premium: {
    label: 'Premium',
    Icon: Sparkles,
    color: 'var(--heat-purple)',
    sortBy: ['gemsPurchasedTotal', 'gemsPurchased'],
  },
  cases: { label: 'Cases', Icon: PackageOpen, color: 'var(--heat-cyan)', sortBy: ['standardCasesOpened'] },
}

/**
 * The category stamped by {@link buildColumns}, else General.
 */
export function columnCategory(column: { meta?: DataColumnMeta }): Category {
  return column.meta?.category ?? 'general'
}

/**
 * Assembles a table's columns from category groups in {@link CATEGORIES} order,
 * so the table and the Columns menu always agree.
 */
export function buildColumns<TData extends RowData>(
  identity: ColumnDef<TData>,
  groups: Partial<Record<Category, ColumnDef<TData>[]>>,
  link?: ColumnDef<TData>,
): ColumnDef<TData>[] {
  const grouped = CATEGORIES.flatMap(category =>
    (groups[category] ?? []).map(column => ({
      ...column,
      meta: { ...column.meta, category },
    })),
  )

  return link ? [identity, ...grouped, link] : [identity, ...grouped]
}
