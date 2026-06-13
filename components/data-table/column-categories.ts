import type { ColumnDef } from '@tanstack/react-table'
import type { LucideIcon } from 'lucide-react'

import { Building2, Coins, Compass, Landmark, LayoutGrid, PackageOpen, Sparkles, Swords, Trophy } from 'lucide-react'

/**
 * Categories group the (long) column list in the Columns menu into collapsible
 * sections, each with an icon and a toggle-all, and set the left-to-right order
 * of the data columns. A column's category is declared by the group it sits in
 * (see {@link buildColumns}), which stamps it onto `meta.category`; anything
 * unstamped (the identity column, a trailing link column, or a plain table that
 * does not use buildColumns) falls back to General, the universal overview bucket
 * (scores, size, dates, affiliations). Ethics / Government / MU-specific are
 * entity-specific (parties / countries / MUs).
 *
 * This array is the single source of truth for both the set of categories and
 * their order: {@link Category} is derived from it, and the Columns menu and
 * {@link buildColumns} both iterate it.
 */
export const CATEGORIES = [
  'points',
  'general',
  'combat',
  'ethics',
  'government',
  'muSpecific',
  'wealth',
  'premium',
  'cases',
] as const

export type Category = (typeof CATEGORIES)[number]

/**
 * Per-category presentation: menu label, icon, and an optional themed color.
 *
 * Every category but General carries a `color`, so it shows its icon in the
 * table header as well as the Columns menu. The themed groups use saturated hues
 * (Points teal, Combat red, Ethics blue, Wealth gold, Premium purple); the
 * entity-specific Government / MU-specific use a neutral slate (they never share
 * a table, so reusing slate is safe). General is the catch-all (level, members,
 * dates, affiliations) where a generic glyph per header is just noise, so it
 * stays colorless and appears only in the Columns menu.
 */
export const CATEGORY_META: Record<Category, { label: string, Icon: LucideIcon, color?: string }> = {
  points: { label: 'Points', Icon: Trophy, color: 'var(--heat-teal)' },
  general: { label: 'General', Icon: LayoutGrid },
  combat: { label: 'Combat', Icon: Swords, color: 'var(--heat-red)' },
  ethics: { label: 'Ethics', Icon: Compass, color: 'var(--heat-blue)' },
  government: { label: 'Government', Icon: Landmark, color: 'var(--heat-slate)' },
  muSpecific: { label: 'MU-specific', Icon: Building2, color: 'var(--heat-slate)' },
  wealth: { label: 'Wealth', Icon: Coins, color: 'var(--heat-gold)' },
  premium: { label: 'Premium', Icon: Sparkles, color: 'var(--heat-purple)' },
  cases: { label: 'Cases', Icon: PackageOpen, color: 'var(--heat-cyan)' },
}

/**
 * The category a column belongs to. Set on `meta.category` by {@link
 * buildColumns} from the group the column was declared in; columns left
 * unstamped fall back to General. Read by the Columns menu, the header icon, and
 * the column order.
 */
export function columnCategory<TData, TValue>(column: ColumnDef<TData, TValue>): Category {
  return column.meta?.category ?? 'general'
}

/**
 * Assembles a table's column list from category-keyed groups. The identity
 * column leads, an optional link column trails, and the groups in between are
 * emitted in {@link CATEGORIES} order, so the table order always matches the
 * Columns menu while each group keeps its own internal order. Every grouped
 * column is stamped with its `meta.category`, the single source of truth that
 * the menu grouping and header icon read back.
 */
export function buildColumns<TData>(
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
