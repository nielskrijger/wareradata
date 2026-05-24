'use client'

import type { ColumnDef, RowData, VisibilityState } from '@tanstack/react-table'
import type { ReactNode } from 'react'
import {
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { ChevronDown, X } from 'lucide-react'
import { useEffect, useRef, useState, useTransition } from 'react'

import { Button, buttonVariants } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import { useTableUrlState } from './use-table-url-state'

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
  /**
   * Optional element rendered next to the search input — typically a help
   * affordance (info icon + popover) for pages that support advanced
   * query syntax.
   */
  searchHint?: ReactNode
}

export function DataTable<TData, TValue>({
  columns,
  initialData,
  initialSort,
  pageSize = 25,
  fetchPage,
  searchPlaceholder = 'Filter…',
  searchHint,
}: DataTableProps<TData, TValue>) {
  const {
    q,
    filterInput,
    setFilterInput,
    sorting,
    setSorting,
    pageIndex,
    setPageIndex,
    isAtInitialState,
  } = useTableUrlState({ initialSort })

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [data, setData] = useState<PageResult<TData>>(initialData)
  const [isPending, startTransition] = useTransition()

  // Skip the very first fetch when state matches initialData (no URL params).
  // After any state change, fetch from the server.
  const firstRenderRef = useRef(true)

  useEffect(() => {
    if (firstRenderRef.current) {
      firstRenderRef.current = false
      if (isAtInitialState) {
        return
      }
    }
    const first = sorting[0]
    const req: PageRequest = {
      page: pageIndex,
      pageSize,
      sort: first?.id ?? null,
      dir: first?.desc ? 'desc' : 'asc',
      filter: q,
    }
    startTransition(async () => {
      const result = await fetchPage(req)
      setData(result)
    })
  }, [pageIndex, pageSize, sorting, q, fetchPage, isAtInitialState])

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
        <div className="relative w-full max-w-xl">
          <Input
            value={filterInput}
            onChange={e => setFilterInput(e.target.value)}
            placeholder={searchPlaceholder}
            className="pr-8"
          />
          {filterInput && (
            <button
              type="button"
              onClick={() => setFilterInput('')}
              aria-label="Clear filter"
              className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2 rounded p-0.5"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        {searchHint}
        <DropdownMenu>
          <DropdownMenuTrigger className={cn(buttonVariants({ variant: 'outline' }), 'ml-auto')}>
            Columns <ChevronDown className="ml-1 h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="!w-auto min-w-40">
            <DropdownMenuItem closeOnClick={false} onClick={() => table.toggleAllColumnsVisible(true)}>
              Show all
            </DropdownMenuItem>
            <DropdownMenuItem closeOnClick={false} onClick={() => table.toggleAllColumnsVisible(false)}>
              Hide all
            </DropdownMenuItem>
            <DropdownMenuSeparator />
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
