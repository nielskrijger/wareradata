'use client'

import type { ColumnDef, RowData, SortingState, VisibilityState } from '@tanstack/react-table'
import {
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { ChevronDown } from 'lucide-react'
import * as React from 'react'

import { Button, buttonVariants } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

import { DataTableHeaderCell } from './data-table-header-cell'
import { DataTableRow } from './data-table-row'

/**
 * Extend TanStack's `columnDef.meta` so column defs can declare `meta:
 * { align: 'right', minWidth: 80 }` in a type-safe way. The generics match
 * the library's signature (required for declaration merging) but go unused
 * here.
 */
declare module '@tanstack/react-table' {
  // eslint-disable-next-line unused-imports/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    align?: 'left' | 'right'
    /**
     * Minimum column width in px. Header + cell both get min-width applied.
     */
    minWidth?: number
  }
}

export interface PageRequest {
  page: number
  pageSize: number
  sort: string | null
  dir: 'asc' | 'desc'
  filter: string
}

export interface PageResult<TData> {
  rows: TData[]
  total: number
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  initialData: PageResult<TData>
  initialSort: { id: string, desc: boolean }
  pageSize?: number
  fetchPage: (req: PageRequest) => Promise<PageResult<TData>>
  searchPlaceholder?: string
}

const FILTER_DEBOUNCE_MS = 250

export function DataTable<TData, TValue>({
  columns,
  initialData,
  initialSort,
  pageSize = 25,
  fetchPage,
  searchPlaceholder = 'Filter…',
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([initialSort])
  const [filterInput, setFilterInput] = React.useState('')
  const [filter, setFilter] = React.useState('')
  const [pageIndex, setPageIndex] = React.useState(0)
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})

  const [data, setData] = React.useState<PageResult<TData>>(initialData)
  const [isPending, startTransition] = React.useTransition()

  // Debounce typing in the filter box. Resetting the page to 0 happens via
  // the fetch effect when `filter` changes below.
  React.useEffect(() => {
    if (filterInput === filter) {
      return
    }
    const handle = setTimeout(setFilter, FILTER_DEBOUNCE_MS, filterInput)
    return () => clearTimeout(handle)
  }, [filterInput, filter])

  const sortKey = sorting[0]
    ? `${sorting[0].id}:${sorting[0].desc ? 'desc' : 'asc'}`
    : ''
  const initialSortKey = `${initialSort.id}:${initialSort.desc ? 'desc' : 'asc'}`

  // Effective page index: any change to sort or filter snaps us back to page 0
  // without an extra render. The Next/Previous buttons drive `pageIndex`
  // directly when neither sort nor filter has changed since the last reset.
  const lastResetKeyRef = React.useRef(`${sortKey}|${filter}`)
  const currentResetKey = `${sortKey}|${filter}`
  if (lastResetKeyRef.current !== currentResetKey) {
    lastResetKeyRef.current = currentResetKey
    if (pageIndex !== 0) {
      setPageIndex(0)
    }
  }

  // Skip the very first fetch — initialData already covers `pageIndex=0, no
  // filter, initial sort`. After any state change, fetch from the server.
  const firstRenderRef = React.useRef(true)

  React.useEffect(() => {
    if (firstRenderRef.current) {
      firstRenderRef.current = false
      if (pageIndex === 0 && filter === '' && sortKey === initialSortKey) {
        return
      }
    }
    const req: PageRequest = {
      page: pageIndex,
      pageSize,
      sort: sorting[0]?.id ?? null,
      dir: sorting[0]?.desc ? 'desc' : 'asc',
      filter,
    }
    startTransition(async () => {
      const result = await fetchPage(req)
      setData(result)
    })
    // We intentionally omit `sorting` from deps: it's covered by `sortKey`.
    // eslint-disable-next-line react/exhaustive-deps
  }, [pageIndex, pageSize, sortKey, filter, fetchPage, initialSortKey])

  const pageCount = Math.max(1, Math.ceil(data.total / pageSize))

  const table = useReactTable({
    data: data.rows,
    columns,
    state: { sorting, columnVisibility, pagination: { pageIndex, pageSize } },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    pageCount,
    getCoreRowModel: getCoreRowModel(),
  })

  const rows = table.getRowModel().rows

  return (
    <div className="space-y-3" data-pending={isPending ? 'true' : 'false'}>
      <div className="flex items-center gap-2">
        <Input
          value={filterInput}
          onChange={e => setFilterInput(e.target.value)}
          placeholder={searchPlaceholder}
          className="max-w-xs"
        />
        <DropdownMenu>
          <DropdownMenuTrigger className={cn(buttonVariants({ variant: 'outline' }), 'ml-auto')}>
            Columns <ChevronDown className="ml-1 h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="!w-auto min-w-40">
            {table
              .getAllColumns()
              .filter(c => c.getCanHide())
              .map((c) => {
                const header = c.columnDef.header
                const label = typeof header === 'string' ? header : c.id
                return (
                  <DropdownMenuCheckboxItem
                    key={c.id}
                    checked={c.getIsVisible()}
                    onCheckedChange={value => c.toggleVisibility(!!value)}
                  >
                    {label}
                  </DropdownMenuCheckboxItem>
                )
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className={cn('rounded-md border', isPending && 'opacity-60')}>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map(hg => (
              <TableRow key={hg.id}>
                {hg.headers.map(header => (
                  <DataTableHeaderCell key={header.id} header={header} />
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {rows.map(row => <DataTableRow key={row.id} row={row} />)}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={table.getVisibleLeafColumns().length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="text-muted-foreground flex items-center justify-between text-sm">
        <span>{data.total.toLocaleString()} rows</span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPageIndex(p => Math.max(0, p - 1))}
            disabled={pageIndex === 0 || isPending}
          >
            Previous
          </Button>
          <span>
            Page {pageIndex + 1} of {pageCount}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPageIndex(p => Math.min(pageCount - 1, p + 1))}
            disabled={pageIndex >= pageCount - 1 || isPending}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
