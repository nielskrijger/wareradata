import type { Row } from '@tanstack/react-table'

import { HeatCell } from '@/components/data-table/heat-cell'
import { TableCell, TableRow } from '@/components/ui/table'
import { EMPTY } from '@/lib/format'

interface Props<TData> {
  row: Row<TData>
}

export function DataTableRow<TData>({ row }: Props<TData>) {
  return (
    <TableRow>
      {row.getVisibleCells().map((cell) => {
        const meta = cell.column.columnDef.meta
        const align = meta?.align ?? 'left'
        const width = meta?.width
        const style = width ? { width: `${width}px` } : undefined

        // Cells that render the bare empty sentinel get muted centrally, so
        // every `?? EMPTY` column reads grey without per-column styling.
        // flexRender wraps the cell fn in createElement, so the bare string
        // never survives as a value to compare; instead we invoke the renderer
        // directly (these cells are pure formatters with no hooks) and check.
        const cellDef = cell.column.columnDef.cell
        const rendered = typeof cellDef === 'function' ? cellDef(cell.getContext()) : cellDef
        if (rendered === EMPTY) {
          return (
            <TableCell
              key={cell.id}
              className={align === 'right' ? 'text-muted-foreground text-right tabular-nums' : 'text-muted-foreground'}
              style={style}
            >
              {EMPTY}
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
            className={align === 'right' ? 'text-right tabular-nums' : undefined}
            style={style}
          >
            {wrapped}
          </TableCell>
        )
      })}
    </TableRow>
  )
}
