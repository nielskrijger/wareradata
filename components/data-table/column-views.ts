import type { ColumnVisibilityState, RowData } from '@tanstack/react-table'

import type { Category } from './column-categories'
import type { ColumnDef } from './features'

import { CATEGORIES, CATEGORY_META, columnCategory } from './column-categories'

/**
 * A table's column views: Overview (the General columns), one per category,
 * and All (every column, customised with the Columns menu).
 */
export type ColumnView = 'overview' | Category | 'all'

export function columnId<TData extends RowData>(c: ColumnDef<TData>): string {
  return c.id ?? ('accessorKey' in c ? String(c.accessorKey) : '')
}

/**
 * The identity column (MU / Country / User / …), pinned first on every view.
 */
function identityId<TData extends RowData>(columns: ColumnDef<TData>[]): string | undefined {
  return columns[0] ? columnId(columns[0]) : undefined
}

/**
 * The headline Points column, which Overview shows next to the General columns.
 */
function headlinePointsId<TData extends RowData>(columns: ColumnDef<TData>[]): string | undefined {
  const points = columns.find(c => columnCategory(c) === 'points')

  return points ? columnId(points) : undefined
}

/**
 * The views a table offers, in tab order. Empty when it has fewer than two
 * categories to split by, so it keeps a single all-columns view.
 */
export function columnViews<TData extends RowData>(columns: ColumnDef<TData>[]): ColumnView[] {
  const categories = CATEGORIES.filter(category =>
    category !== 'general' && columns.some(c => columnCategory(c) === category),
  )

  return categories.length < 2 ? [] : ['overview', ...categories, 'all']
}

/**
 * The columns a view shows, or null for All, which follows the user's Columns
 * menu choices. Every view keeps the identity column. Overview adds the
 * headline Points column and the General columns that aren't hidden by
 * default; a category view shows all of that category's columns.
 */
export function viewVisibility<TData extends RowData>(
  columns: ColumnDef<TData>[],
  view: ColumnView,
): ColumnVisibilityState | null {
  if (view === 'all') {
    return null
  }

  const identity = identityId(columns)
  const points = headlinePointsId(columns)

  return Object.fromEntries(columns.map((c) => {
    const id = columnId(c)
    const category = columnCategory(c)
    const shown = id === identity || (view === 'overview'
      ? id === points || (category === 'general' && !c.meta?.hiddenByDefault)
      : category === view)

    return [id, shown]
  }))
}

/**
 * Columns per category, matching what each category tab shows besides the
 * identity column (which is General, so never counted).
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

export interface SortSpec {
  id: string
  desc: boolean
}

/**
 * The sort each category tab opens with, so rows are ordered by a column the
 * tab shows. Overview and All use the table's own default sort.
 */
export function columnViewSorts<TData extends RowData>(
  columns: ColumnDef<TData>[],
): Partial<Record<Category, SortSpec>> {
  const sorts: Partial<Record<Category, SortSpec>> = {}
  for (const category of CATEGORIES) {
    const inCategory = columns.filter(c => columnCategory(c) === category && c.enableSorting !== false)
    const preferred = CATEGORY_META[category].sortBy
      ?.map(id => inCategory.find(c => columnId(c) === id))
      .find(c => c != null)

    const column = preferred ?? inCategory[0]
    if (category !== 'general' && column) {
      // Rank columns sort ascending first, so the best comes first either way.
      sorts[category] = { id: columnId(column), desc: column.sortDescFirst !== false }
    }
  }

  return sorts
}
