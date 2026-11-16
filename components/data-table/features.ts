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
   * Heat-tint the cell text by the column's value relative to the dataset
   * range (see HeatCell). `'ramp'` = green-only full gradient (min neutral →
   * max full green); `'median'` = diverging green→red centered on the
   * median, higher is better; `'invert'` = diverging the other way (lower is
   * better) centered on the midpoint, for ranks/taxes; `'invertMedian'` =
   * lower is better but centered on the median, for skewed columns like wars.
   * The accessorKey must match a key present in the response `ranges`.
   */
  heat?: 'ramp' | 'median' | 'invert' | 'invertMedian'

  /**
   * For diverging columns (`'median'` / `'invert'`), the value that reads
   * neutral (no tint). Defaults to the median (`'median'`) or dataset
   * midpoint (`'invert'`); set it for scales with a meaningful baseline,
   * e.g. `10` so a 10% tax is neutral, lower greens, higher reds.
   */
  heatCenter?: number

  /**
   * Compress the heat scale logarithmically for extremely skewed columns
   * (e.g. casesOpened, spanning 1 → 170k) so typical values still get tinted
   * instead of everything reading neutral until the lone outlier.
   */
  heatLogScale?: boolean

  /**
   * Flip the sort-direction indicator. For rank columns sorted ascending
   * (rank #1 first), the up-arrow reads as "smallest first" → confusing
   * since "smallest" is actually the best. Setting this true shows the
   * down-arrow on asc and up-arrow on desc so the icon points toward the
   * "less good" end of the column.
   */
  sortInvert?: boolean

  /**
   * The column's category, driving the Columns-menu grouping, the header icon,
   * and column ordering. Set by buildColumns from the group the column was
   * declared in (see column-categories.ts); columns left unstamped fall back to
   * General. Authoring it by hand is unnecessary in a buildColumns table.
   */
  category?: Category

  /**
   * Help text shown in a tooltip when hovering the column header. Use for
   * columns whose terse label benefits from a word of explanation.
   */
  tooltip?: string

  /**
   * Extra classes for the body TableCell, e.g. `relative` so the cell
   * renderer can paint a full-bleed background layer (`absolute inset-0`)
   * that tracks the row height. A negative-margin wrapper can't: its height
   * stays that of its own content, so it falls short when another cell makes
   * the row taller.
   */
  cellClassName?: string
}

export interface DataTableMeta {
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
