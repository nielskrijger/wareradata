import type { Header } from '@tanstack/react-table'
import type { CSSProperties } from 'react'

import { flexRender } from '@tanstack/react-table'

import { TableHead } from '@/components/ui/table'
import { cn } from '@/lib/utils'

import { SortIcon } from './sort-icon'

interface Props<TData> {
  header: Header<TData, unknown>
  sticky?: boolean
}

// Above the body's sticky cells (z-10) so the top-left corner stays on top.
const STICKY = 'bg-table-surface sticky left-0 z-20 shadow-[4px_0_6px_-2px_rgba(0,0,0,0.35)]'

// The pinned first column is capped narrow on mobile (names ellipsize) to leave
// more room for the scrolling data columns, then takes its real width from sm
// up. Width comes from a CSS var so the mobile-first w-* classes win — an inline
// `width` would always override them.
const STICKY_WIDTH = 'w-[140px] sm:w-[var(--col-w)]'

export function DataTableHeaderCell<TData>({ header, sticky }: Props<TData>) {
  if (header.isPlaceholder) {
    return <TableHead className={sticky ? STICKY : undefined} />
  }
  const canSort = header.column.getCanSort()
  const sorted = header.column.getIsSorted()
  const align = header.column.columnDef.meta?.align ?? 'left'
  const width = header.column.columnDef.meta?.width
  const sortInvert = header.column.columnDef.meta?.sortInvert ?? false
  const iconState = sortInvert && sorted ? (sorted === 'asc' ? 'desc' : 'asc') : sorted
  const headClass = cn(align === 'right' ? 'text-right' : undefined, sticky && STICKY, sticky && width && STICKY_WIDTH)
  const style: CSSProperties | undefined = width
    ? (sticky ? { '--col-w': `${width}px` } as CSSProperties : { width: `${width}px` })
    : undefined
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
        <SortIcon state={iconState} />
      </button>
    </TableHead>
  )
}
