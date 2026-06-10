'use client'

import type { Column, Table } from '@tanstack/react-table'

import type { Category } from './column-categories'
import { Check, ChevronDown, ChevronRight, Minus } from 'lucide-react'

import { useState } from 'react'
import { buttonVariants } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

import { cn } from '@/lib/utils'

import { CATEGORIES, CATEGORY_META, columnCategory } from './column-categories'

type TriState = 'all' | 'some' | 'none'

function labelOf<TData>(column: Column<TData>): string {
  const header = column.columnDef.header
  return typeof header === 'string' ? header : column.id
}

/**
 * The table's "Columns" control: a popover whose hideable columns are grouped
 * into collapsible categories. Each group has a colored icon, a visible/total
 * count, a chevron to expand, and a 3-state checkbox that toggles the whole
 * group. Plain "Show all / Hide all" sit on top. Replaces the flat dropdown so a
 * long column list stays manageable.
 */
export function ColumnsMenu<TData>({ table }: { table: Table<TData> }) {
  const [open, setOpen] = useState<Set<Category>>(() => new Set())
  const toggleOpen = (category: Category) =>
    setOpen((current) => {
      const next = new Set(current)
      if (next.has(category)) {
        next.delete(category)
      } else {
        next.add(category)
      }
      return next
    })

  const allColumns = table.getAllColumns()
  // The leading identity column (MU / Country / User / …) gets its own top-level
  // toggle rather than being buried in the General group.
  const primary = allColumns[0]?.getCanHide() ? allColumns[0] : null
  const hideable = allColumns.filter(c => c.getCanHide() && c !== primary)
  const byCategory = new Map<Category, Column<TData>[]>()
  for (const column of hideable) {
    const category = columnCategory(column.columnDef)
    const list = byCategory.get(category)
    if (list) {
      list.push(column)
    } else {
      byCategory.set(category, [column])
    }
  }

  return (
    <Popover>
      <PopoverTrigger className={cn(buttonVariants({ variant: 'outline' }), 'ml-auto')}>
        Columns
        <ChevronDown className="ml-1 size-4" />
      </PopoverTrigger>
      <PopoverContent align="end" className="max-h-[70vh] w-56 overflow-y-auto p-1">
        <button
          type="button"
          onClick={() => table.toggleAllColumnsVisible(true)}
          className="hover:bg-accent flex w-full items-center rounded-md px-2 py-1.5 text-left text-sm"
        >
          Show all
        </button>
        <button
          type="button"
          onClick={() => hideable.forEach(c => c.toggleVisibility(false))}
          className="hover:bg-accent flex w-full items-center rounded-md px-2 py-1.5 text-left text-sm"
        >
          Hide all
        </button>
        <div className="bg-border -mx-1 my-1 h-px" />

        {primary && (
          <button
            type="button"
            onClick={() => primary.toggleVisibility(!primary.getIsVisible())}
            className="hover:bg-accent flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm font-medium"
          >
            <span className="flex size-4 shrink-0 items-center justify-center">
              {primary.getIsVisible() && <Check className="size-3.5" />}
            </span>
            {labelOf(primary)}
          </button>
        )}

        {CATEGORIES.map((category) => {
          const cols = byCategory.get(category)
          if (!cols || cols.length === 0) {
            return null
          }
          const meta = CATEGORY_META[category]
          const Icon = meta.Icon
          const onCount = cols.filter(c => c.getIsVisible()).length
          const state: TriState = onCount === cols.length ? 'all' : onCount === 0 ? 'none' : 'some'
          const isOpen = open.has(category)
          const Chevron = isOpen ? ChevronDown : ChevronRight
          const toggleAll = () => {
            const target = state !== 'all'
            cols.forEach(c => c.toggleVisibility(target))
          }

          return (
            <div key={category}>
              <div className="flex items-center text-sm font-medium">
                <button
                  type="button"
                  onClick={() => toggleOpen(category)}
                  className="hover:bg-accent flex flex-1 items-center gap-1.5 rounded-md px-2 py-1.5"
                >
                  <Chevron className="text-muted-foreground size-4 shrink-0" />
                  <Icon className={cn('size-3.5 shrink-0', !meta.color && 'text-muted-foreground')} style={meta.color ? { color: meta.color } : undefined} />
                  {meta.label}
                  <span className="text-muted-foreground ml-auto text-xs tabular-nums">
                    {onCount}
                    /
                    {cols.length}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={toggleAll}
                  title="Toggle all"
                  aria-label={`Toggle all ${meta.label} columns`}
                  className="hover:bg-accent mr-0.5 flex size-7 shrink-0 items-center justify-center rounded-md"
                >
                  <TriBox state={state} />
                </button>
              </div>

              {isOpen && cols.map(column => (
                <button
                  key={column.id}
                  type="button"
                  onClick={() => column.toggleVisibility(!column.getIsVisible())}
                  className="hover:bg-accent flex w-full items-center gap-2 rounded-md py-1.5 pr-2 pl-7 text-left text-sm"
                >
                  <span className="flex size-4 shrink-0 items-center justify-center">
                    {column.getIsVisible() && <Check className="size-3.5" />}
                  </span>
                  {labelOf(column)}
                </button>
              ))}
            </div>
          )
        })}
      </PopoverContent>
    </Popover>
  )
}

function TriBox({ state }: { state: TriState }) {
  return (
    <span
      className={cn(
        'flex size-4 items-center justify-center rounded-[3px] border',
        state === 'none' ? 'border-muted-foreground/50' : 'border-foreground/70 bg-foreground/10',
      )}
    >
      {state === 'all' && <Check className="size-3" />}
      {state === 'some' && <Minus className="size-3" />}
    </span>
  )
}
