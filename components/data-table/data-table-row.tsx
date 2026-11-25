import type { Row, RowData } from '@tanstack/react-table'

import type { DataTableFeatures } from './features'

import { HeatCell } from '@/components/data-table/heat-cell'
import { EmptyDash } from '@/components/empty-dash'
import { TableCell, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'

import { columnWidthStyle, STICKY_CELL, STICKY_WIDTH } from './sticky-column'

interface Props<TData extends RowData> {
  row: Row<DataTableFeatures, TData>
  onHover?: (row: TData | null) => void
}

export function DataTableRow<TData extends RowData>({ row, onHover }: Props<TData>) {
  return (
    <TableRow
      onPointerEnter={onHover && (() => onHover(row.original))}
      onPointerLeave={onHover && (() => onHover(null))}
    >
      {row.getVisibleCells().map((cell, index) => {
        const meta = cell.column.columnDef.meta
        const align = meta?.align ?? 'left'
        const width = meta?.width
        const sticky = index === 0 ? STICKY_CELL : undefined
        const style = columnWidthStyle(width, index === 0)

        // Call the cell renderer directly to see a raw null (flexRender would
        // wrap it), so any empty cell gets the muted dash. Cells are pure
        // formatters, so calling them outside React is safe.
        const cellDef = cell.column.columnDef.cell
        const rendered = typeof cellDef === 'function' ? cellDef(cell.getContext()) : cellDef
        const heat = meta?.heat
        let content = rendered
        if (rendered == null) {
          content = <EmptyDash />
        } else if (heat) {
          content = (
            <HeatCell
              value={cell.getValue() as number | null | undefined}
              range={cell.getContext().table.options.meta?.ranges?.[cell.column.id]}
              mode={heat}
              center={meta?.heatCenter}
              logScale={meta?.heatLogScale}
            >
              {rendered}
            </HeatCell>
          )
        }

        return (
          <TableCell
            key={cell.id}
            className={cn(
              align === 'right' ? 'text-right tabular-nums' : undefined,
              meta?.cellClassName,
              sticky,
              sticky && width && STICKY_WIDTH,
            )}
            style={style}
          >
            {content}
          </TableCell>
        )
      })}
    </TableRow>
  )
}
