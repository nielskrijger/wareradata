import type { Header, RowData } from '@tanstack/react-table'
import type { DataTableFeatures } from './features'

import { FlexRender } from '@tanstack/react-table'

import { TableHead } from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

import { CategoryIcon } from './category-icon'
import { CATEGORY_META, columnCategory } from './column-categories'
import { SortIcon } from './sort-icon'
import { columnWidthStyle, STICKY_HEAD, STICKY_WIDTH } from './sticky-column'

interface Props<TData extends RowData> {
  header: Header<DataTableFeatures, TData>
  sticky?: boolean
}

export function DataTableHeaderCell<TData extends RowData>({ header, sticky }: Props<TData>) {
  if (header.isPlaceholder) {
    return <TableHead className={sticky ? STICKY_HEAD : undefined} />
  }

  const canSort = header.column.getCanSort()
  const sorted = header.column.getIsSorted()
  const align = header.column.columnDef.meta?.align ?? 'left'
  const width = header.column.columnDef.meta?.width
  const sortInvert = header.column.columnDef.meta?.sortInvert ?? false
  const iconState = sortInvert && sorted ? (sorted === 'asc' ? 'desc' : 'asc') : sorted
  const headClass = cn(
    align === 'right' ? 'text-right' : undefined,
    sticky && STICKY_HEAD,
    sticky && width && STICKY_WIDTH,
  )

  const style = columnWidthStyle(width, Boolean(sticky))

  const rendered = <FlexRender header={header} />

  // Prefix each column with its category's icon, the same symbol the Columns
  // menu shows for that group. General (the catch-all) has no color and stays
  // iconless here; it still shows its icon in the Columns menu.
  const category = columnCategory(header.column.columnDef)
  const label = CATEGORY_META[category].color ? (
    <span className="inline-flex items-center gap-1">
      <CategoryIcon category={category} />
      {rendered}
    </span>
  ) : rendered

  // Optional header help text (meta.tooltip). The trigger renders as a plain
  // inline span so it nests cleanly inside the sort button below.
  const tip = header.column.columnDef.meta?.tooltip
  const content = tip ? (
    <Tooltip>
      <TooltipTrigger render={<span className="inline-flex items-center gap-1" />}>
        {label}
      </TooltipTrigger>
      <TooltipContent>{tip}</TooltipContent>
    </Tooltip>
  ) : label

  if (!canSort) {
    return <TableHead className={headClass} style={style}>{content}</TableHead>
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
        {content}
        <SortIcon state={iconState} />
      </button>
    </TableHead>
  )
}
