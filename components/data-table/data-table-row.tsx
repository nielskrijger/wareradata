import type { Row } from '@tanstack/react-table'

import { flexRender } from '@tanstack/react-table'

import { TableCell, TableRow } from '@/components/ui/table'

interface Props<TData> {
  row: Row<TData>
}

export function DataTableRow<TData>({ row }: Props<TData>) {
  return (
    <TableRow>
      {row.getVisibleCells().map((cell) => {
        const align = cell.column.columnDef.meta?.align ?? 'left'
        return (
          <TableCell
            key={cell.id}
            className={align === 'right' ? 'text-right tabular-nums' : undefined}
          >
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </TableCell>
        )
      })}
    </TableRow>
  )
}
