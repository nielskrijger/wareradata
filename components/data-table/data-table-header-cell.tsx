import type { Header } from '@tanstack/react-table'

import { flexRender } from '@tanstack/react-table'

import { TableHead } from '@/components/ui/table'
import { cn } from '@/lib/utils'

import { SortIcon } from './sort-icon'

interface Props<TData> {
  header: Header<TData, unknown>
}

export function DataTableHeaderCell<TData>({ header }: Props<TData>) {
  if (header.isPlaceholder) {
    return <TableHead />
  }
  const canSort = header.column.getCanSort()
  const sorted = header.column.getIsSorted()
  const align = header.column.columnDef.meta?.align ?? 'left'
  const width = header.column.columnDef.meta?.width
  const headClass = align === 'right' ? 'text-right' : undefined
  const style = width ? { width: `${width}px` } : undefined
  const rendered = flexRender(header.column.columnDef.header, header.getContext())

  if (!canSort) {
    return <TableHead className={headClass} style={style}>{rendered}</TableHead>
  }
  return (
    <TableHead className={headClass} style={style}>
      <button
        type="button"
        onClick={header.column.getToggleSortingHandler()}
        className={cn(
          'hover:text-foreground inline-flex items-center gap-1',
          align === 'right' && 'flex-row-reverse',
        )}
      >
        {rendered}
        <SortIcon state={sorted} />
      </button>
    </TableHead>
  )
}
