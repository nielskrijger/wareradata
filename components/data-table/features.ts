import type { RowData, ColumnDef as TanstackColumnDef } from '@tanstack/react-table'

import type { Category } from './column-categories'

import type { Range } from '@/lib/query'
import { columnVisibilityFeature, metaHelper, rowSortingFeature, tableFeatures } from '@tanstack/react-table'

/**
 * `columnDef.meta` for every DataTable column, e.g. `meta: { align: 'right', width: 80 }`.
 */
export interface DataColumnMeta {
  align?: 'left' | 'right'

  /**
   * Column width in px. With table-layout: fixed (set on the <Table>),
   * this is the actual rendered width — content overflowing gets the
   * whitespace-nowrap + ellipsis treatment from TableCell.
   */
  width?: number

  /**
   * Heat-tint the cell by its value within the response `ranges` (see
   * HeatCell); the accessorKey must be a key in `ranges`.
   */
  heat?: 'ramp' | 'median' | 'invert' | 'invertMedian'

  /**
   * For diverging modes, the value that reads neutral, e.g. `10` so a 10% tax
   * is untinted.
   */
  heatCenter?: number

  /**
   * Compress the heat scale logarithmically for extremely skewed columns
   * (e.g. casesOpened, spanning 1 → 170k) so typical values still get tinted
   * instead of everything reading neutral until the lone outlier.
   */
  heatLogScale?: boolean

  /**
   * Flip the sort arrow, for rank columns where ascending puts the best first
   * and an up arrow would read as "smallest first".
   */
  sortInvert?: boolean

  /**
   * Set by buildColumns from the group the column is declared in.
   */
  category?: Category

  /**
   * Help text shown in a tooltip when hovering the column header. Use for
   * columns whose terse label benefits from a word of explanation.
   */
  tooltip?: string

  /**
   * Classes for the body cell, e.g. `relative` so a cell can paint an
   * `absolute inset-0` layer that tracks the row height when another cell
   * makes the row taller.
   */
  cellClassName?: string

  /**
   * Start the column hidden until the user turns it on in the Columns menu.
   */
  hiddenByDefault?: boolean
}

interface DataTableMeta {
  ranges?: Record<string, Range>
}

/**
 * Sorting, filtering and paging all run on the server, so the table only
 * needs the sort-toggle and visibility APIs, without client row models.
 */
export const dataTableFeatures = tableFeatures({
  rowSortingFeature,
  columnVisibilityFeature,
  columnMeta: metaHelper<DataColumnMeta>(),
  tableMeta: metaHelper<DataTableMeta>(),
})

export type DataTableFeatures = typeof dataTableFeatures

export type ColumnDef<TData extends RowData> = TanstackColumnDef<DataTableFeatures, TData>
