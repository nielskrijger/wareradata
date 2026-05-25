import type { Row } from '@tanstack/react-table'

import { HeatCell } from '@/components/data-table/heat-cell'
import { EmptyDash } from '@/components/empty-dash'
import { TableCell, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'

interface Props<TData> {
  row: Row<TData>
}

// Pins the first column while the rest scroll horizontally. bg-table-surface
// matches the table fill (opaque, so scrolled columns don't bleed through);
// a soft right-edge shadow signals the pin without recoloring the column.
const STICKY = 'bg-table-surface sticky left-0 z-10 shadow-[4px_0_6px_-2px_rgba(0,0,0,0.35)]'

export function DataTableRow<TData>({ row }: Props<TData>) {
  return (
    <TableRow>
      {row.getVisibleCells().map((cell, index) => {
        const meta = cell.column.columnDef.meta
        const align = meta?.align ?? 'left'
        const width = meta?.width
        const style = width ? { width: `${width}px` } : undefined
        const sticky = index === 0 ? STICKY : undefined

        // Cells with no value render the muted EmptyDash, so every column that
        // returns null for a missing value reads grey without per-column
        // styling. flexRender wraps the cell fn in createElement, so we invoke
        // the renderer directly (these cells are pure formatters with no hooks)
        // to see the raw null before it's wrapped.
        const cellDef = cell.column.columnDef.cell
        const rendered = typeof cellDef === 'function' ? cellDef(cell.getContext()) : cellDef
        if (rendered == null) {
          return (
            <TableCell
              key={cell.id}
              className={cn(align === 'right' ? 'text-right tabular-nums' : undefined, sticky)}
              style={style}
            >
              <EmptyDash />
            </TableCell>
          )
        }

        const heat = meta?.heat
        const wrapped = heat
          ? (
              <HeatCell
                value={cell.getValue() as number | null | undefined}
                range={cell.getContext().table.options.meta?.ranges?.[cell.column.id]}
                mode={heat}
                center={meta?.heatCenter}
                log={meta?.heatLog}
              >
                {rendered}
              </HeatCell>
            )
          : rendered

        return (
          <TableCell
            key={cell.id}
            className={cn(align === 'right' ? 'text-right tabular-nums' : undefined, sticky)}
            style={style}
          >
            {wrapped}
          </TableCell>
        )
      })}
    </TableRow>
  )
}
