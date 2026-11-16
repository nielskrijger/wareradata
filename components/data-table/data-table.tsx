'use client'

import type { RowData } from '@tanstack/react-table'
import type { ReactNode } from 'react'

import type { ColumnDef } from './features'

import type { Range } from '@/lib/query'
import { useTable } from '@tanstack/react-table'
import { RotateCw, X } from 'lucide-react'
import { Suspense, useEffect, useRef, useState, useTransition } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

import { ColumnsMenu } from './columns-menu'
import { DataTableHeaderCell } from './data-table-header-cell'
import { DataTableRow } from './data-table-row'
import { dataTableFeatures } from './features'
import { fetchPaginated } from './fetch-paginated'
import { Pagination } from './pagination'
import { usePersistedColumnVisibility } from './use-persisted-column-visibility'
import { useTableUrlState } from './use-table-url-state'

export interface PageRequest {
  page: number
  pageSize: number
  sort: string | null
  dir: 'asc' | 'desc'
  filter: string
}

export interface PageResult<TData extends RowData> {
  rows: TData[]
  total: number

  /**
   * Per-column [min, max, median] over the full filtered set, for heat coloring.
   */
  ranges?: Record<string, Range>
}

interface DataTableProps<TData extends RowData> {
  /**
   * Names the table's remembered column visibility. Tables sharing a column
   * set share an id, so hiding a column on /users also hides it on a country's
   * citizens tab.
   */
  tableId: string
  columns: ColumnDef<TData>[]
  initialData: PageResult<TData>
  initialSort: { id: string, desc: boolean }

  /**
   * Must match the size of `initialData` and be one of PAGE_SIZES.
   */
  pageSize?: number

  /**
   * The `/api/*` route serving this table's pages.
   */
  endpoint: string

  /**
   * A locked-in scope (e.g. `muId:<id>`) the user's filter can narrow but not widen.
   */
  baseFilter?: string
  searchPlaceholder?: string

  /**
   * Optional element rendered next to the search input — typically a help
   * affordance (info icon + popover) for pages that support advanced
   * query syntax.
   */
  searchHint?: ReactNode

  /**
   * Column ids left out entirely, for columns the page already implies (e.g.
   * MU on an MU's members). Gone from the Columns menu too.
   */
  omitColumns?: string[]
}

/**
 * Wraps the table in a Suspense boundary because the inner component reads URL
 * search params (via nuqs `useTableUrlState` -> `useSearchParams`). Next
 * requires a Suspense boundary around any client component that reads them.
 */
export function DataTable<TData extends RowData>(props: DataTableProps<TData>) {
  return (
    <Suspense>
      <DataTableInner {...props} />
    </Suspense>
  )
}

function DataTableInner<TData extends RowData>({
  tableId,
  columns: allColumns,
  initialData,
  initialSort,
  pageSize: defaultPageSize = 25,
  endpoint,
  baseFilter,
  searchPlaceholder = 'Filter…',
  searchHint,
  omitColumns,
}: DataTableProps<TData>) {
  const columns = omitColumns
    ? allColumns.filter(c => !omitColumns.includes(columnId(c)))
    : allColumns

  const {
    q,
    filterInput,
    setFilterInput,
    sorting,
    setSorting,
    pageIndex,
    setPageIndex,
    pageSize,
    setPageSize,
    isAtInitialState,
  } = useTableUrlState({ initialSort, defaultPageSize })

  // From all columns, so stored choices for omitted ones match the full table's.
  const hiddenByDefault = allColumns
    .filter(c => c.meta?.hiddenByDefault)
    .map(columnId)

  const [columnVisibility, setColumnVisibility] = usePersistedColumnVisibility(tableId, hiddenByDefault)
  const [data, setData] = useState<PageResult<TData>>(initialData)
  const [isPending, startTransition] = useTransition()
  const [loadFailed, setLoadFailed] = useState(false)

  // Lets Retry re-run the fetch effect with unchanged params.
  const [retryCount, setRetryCount] = useState(0)

  // Adopt a fresh `initialData` (after revalidatePath) only while the user
  // hasn't sorted, filtered or paged; React's adjust-state-on-prop-change pattern.
  const [prevInitialData, setPrevInitialData] = useState(initialData)
  if (initialData !== prevInitialData) {
    setPrevInitialData(initialData)
    if (isAtInitialState) {
      setData(initialData)
    }
  }

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

    // Responses can arrive out of order; a stale one must not overwrite a newer result.
    let superseded = false
    startTransition(async () => {
      try {
        const result = await fetchPaginated<TData>(endpoint, req, baseFilter)
        if (!superseded) {
          setData(result)
          setLoadFailed(false)
        }
      } catch {
        if (!superseded) {
          setLoadFailed(true)
        }
      }
    })

    return () => {
      superseded = true
    }
  }, [pageIndex, pageSize, sorting, q, endpoint, baseFilter, isAtInitialState, retryCount])

  const pageCount = Math.max(1, Math.ceil(data.total / pageSize))

  const table = useTable({
    features: dataTableFeatures,
    data: data.rows,
    columns,
    state: { sorting, columnVisibility },
    onSortingChange: setSorting,
    onColumnVisibilityChange: updater => setColumnVisibility(
      updater,
      // Omitted ids count as known so this page keeps their stored choices.
      [...table.getAllLeafColumns().filter(c => c.getCanHide()).map(c => c.id), ...(omitColumns ?? [])],
    ),
    manualSorting: true,
    meta: { ranges: data.ranges },
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
            className="bg-card pr-8"
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
        <ColumnsMenu table={table} />
      </div>

      {loadFailed && (
        <div
          role="alert"
          className="border-destructive/40 bg-destructive/10 flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm"
        >
          <span>Couldn&apos;t load these results. The rows below may be out of date.</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setRetryCount(n => n + 1)}
            disabled={isPending}
          >
            <RotateCw />
            Retry
          </Button>
        </div>
      )}

      <div className={cn(
        // Full-bleed on mobile so the scrolling table gets the whole width; the
        // side borders and rounding come back from sm up.
        'border-input bg-card overflow-hidden border dark:bg-input/50',
        '-mx-6 rounded-none border-x-0 sm:mx-0 sm:rounded-md sm:border-x',
        isPending && 'opacity-60',
      )}
      >
        <Table className="table-fixed">
          <TableHeader>
            {table.getHeaderGroups().map(hg => (
              <TableRow key={hg.id}>
                {hg.headers.map((header, index) => (
                  <DataTableHeaderCell key={header.id} header={header} sticky={index === 0} />
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

      <Pagination
        pageIndex={pageIndex}
        pageCount={pageCount}
        pageSize={pageSize}
        total={data.total}
        disabled={isPending}
        onPageChange={setPageIndex}
        onPageSizeChange={setPageSize}
      />
    </div>
  )
}

function columnId<TData extends RowData>(c: ColumnDef<TData>): string {
  return c.id ?? ('accessorKey' in c ? String(c.accessorKey) : '')
}
