import type { ColumnVisibilityState, RowData } from '@tanstack/react-table'

import type { Category } from './column-categories'
import type { ColumnDef } from './features'

import { CATEGORIES, columnCategory } from './column-categories'

/**
 * A table's column views: Overview (the General columns), one per category,
 * and All (every column, customised with the Columns menu).
 */
export type ColumnView = 'overview' | Category | 'all'

export function columnId<TData extends RowData>(c: ColumnDef<TData>): string {
  return c.id ?? ('accessorKey' in c ? String(c.accessorKey) : '')
}

/**
 * Shown on every view: the identity column and the headline Points column.
 */
function pinnedIds<TData extends RowData>(columns: ColumnDef<TData>[]): Set<string> {
  const points = columns.find(c => columnCategory(c) === 'points')

  return new Set([columns[0], points].filter(c => c != null).map(columnId))
}

/**
 * The views a table offers, in tab order. Empty when it has fewer than two
 * categories to split by, so it keeps a single all-columns view.
 */
export function columnViews<TData extends RowData>(columns: ColumnDef<TData>[]): ColumnView[] {
  const pinned = pinnedIds(columns)
  const categories = CATEGORIES.filter(category =>
    category !== 'general'
    && columns.some(c => columnCategory(c) === category && !pinned.has(columnId(c))),
  )

  return categories.length < 2 ? [] : ['overview', ...categories, 'all']
}

/**
 * The columns a view shows, or null for All, which follows the user's Columns
 * menu choices. Overview leaves out hidden-by-default columns; a category view
 * shows all of its columns.
 */
export function viewVisibility<TData extends RowData>(
  columns: ColumnDef<TData>[],
  view: ColumnView,
): ColumnVisibilityState | null {
  if (view === 'all') {
    return null
  }

  const pinned = pinnedIds(columns)

  return Object.fromEntries(columns.map((c) => {
    const id = columnId(c)
    const category = columnCategory(c)
    const shown = pinned.has(id) || (view === 'overview'
      ? category === 'general' && !c.meta?.hiddenByDefault
      : category === view)

    return [id, shown]
  }))
}

/**
 * Columns per category, for the tab counts. The pinned Points column counts
 * toward Points, so each count matches the category's columns on its tab.
 */
export function columnViewCount<TData extends RowData>(columns: ColumnDef<TData>[]): Partial<Record<Category, number>> {
  const counts: Partial<Record<Category, number>> = {}
  for (const c of columns) {
    const category = columnCategory(c)
    if (category !== 'general') {
      counts[category] = (counts[category] ?? 0) + 1
    }
  }

  return counts
}
