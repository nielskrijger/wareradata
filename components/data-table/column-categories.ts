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

/**
 * Label, icon and color per category.
 *
 * General stays colorless: a glyph on every general header would be noise, so
 * its icon shows only in the Columns menu. Government and MU-specific share
 * slate because they never appear in the same table.
 */
export const CATEGORY_META: Record<Category, { label: string, Icon: LucideIcon, color?: string }> = {
  points: { label: 'Points', Icon: Trophy, color: 'var(--heat-teal)' },
  general: { label: 'General', Icon: LayoutGrid },
  combat: { label: 'Combat', Icon: Swords, color: 'var(--heat-red)' },
  government: { label: 'Government', Icon: Landmark, color: 'var(--heat-slate-text)' },
  muSpecific: { label: 'MU-specific', Icon: Building2, color: 'var(--heat-slate-text)' },
  wealth: { label: 'Wealth', Icon: Coins, color: 'var(--heat-gold)' },
  factories: { label: 'Factories', Icon: Factory, color: 'var(--heat-orange)' },
  employees: { label: 'Employees', Icon: HardHat, color: 'var(--heat-blue)' },
  premium: { label: 'Premium', Icon: Sparkles, color: 'var(--heat-purple)' },
  cases: { label: 'Cases', Icon: PackageOpen, color: 'var(--heat-cyan)' },
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
