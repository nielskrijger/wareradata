'use client'

import type { KeyboardEvent } from 'react'

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import { PAGE_SIZES } from './use-table-url-state'

interface Props {
  pageIndex: number
  pageCount: number
  pageSize: number
  total: number
  disabled: boolean
  onPageChange: (pageIndex: number) => void
  onPageSizeChange: (size: number) => void
}

/**
 * Page numbers are 1-based in the UI and 0-based in the callbacks.
 */
export function Pagination({
  pageIndex,
  pageCount,
  pageSize,
  total,
  disabled,
  onPageChange,
  onPageSizeChange,
}: Props) {
  const isFirst = pageIndex === 0
  const isLast = pageIndex >= pageCount - 1

  function commitPage(raw: string) {
    const page = Number.parseInt(raw, 10)
    if (Number.isNaN(page)) {
      return
    }

    const next = Math.min(pageCount, Math.max(1, page)) - 1
    if (next !== pageIndex) {
      onPageChange(next)
    }
  }

  function onPageKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      commitPage(e.currentTarget.value)
    }
  }

  return (
    <div className="text-muted-foreground flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-sm">
      <div className="flex items-center gap-3">
        <span>
          {total.toLocaleString()}
          {' '}
          rows
        </span>
        <div className="flex items-center gap-1.5">
          <span className="sr-only sm:not-sr-only">Rows per page</span>
          <Select value={pageSize} onValueChange={size => size && onPageSizeChange(size)}>
            <SelectTrigger size="sm" aria-label="Rows per page" className="bg-card text-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="min-w-0">
              {PAGE_SIZES.map(size => <SelectItem key={size} value={size}>{size}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <nav aria-label="Pagination" className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="First page"
          onClick={() => onPageChange(0)}
          disabled={isFirst || disabled}
        >
          <ChevronsLeft />
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Previous page"
          onClick={() => onPageChange(Math.max(0, pageIndex - 1))}
          disabled={isFirst || disabled}
        >
          <ChevronLeft />
        </Button>
        <label className="flex items-center gap-1.5 px-1">
          <span>Page</span>
          <Input
            // Remount so the buttons can reset it while it stays uncontrolled for typing.
            key={pageIndex}
            type="number"
            inputMode="numeric"
            min={1}
            max={pageCount}
            defaultValue={pageIndex + 1}
            onKeyDown={onPageKeyDown}
            onBlur={e => commitPage(e.currentTarget.value)}
            disabled={pageCount <= 1}
            aria-label={`Page number, 1 to ${pageCount}`}
            className="h-7 w-16 px-1.5 text-center [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          <span>
            of
            {' '}
            {pageCount.toLocaleString()}
          </span>
        </label>
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Next page"
          onClick={() => onPageChange(Math.min(pageCount - 1, pageIndex + 1))}
          disabled={isLast || disabled}
        >
          <ChevronRight />
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Last page"
          onClick={() => onPageChange(pageCount - 1)}
          disabled={isLast || disabled}
        >
          <ChevronsRight />
        </Button>
      </nav>
    </div>
  )
}
