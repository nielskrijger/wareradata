'use client'

import type { ColumnView } from './column-views'

import { Columns3, LayoutGrid } from 'lucide-react'

import { Tabs, TabsList, TabsTab } from '@/components/ui/tabs'

import { CategoryIcon } from './category-icon'
import { CATEGORY_META } from './column-categories'

interface Props {
  views: ColumnView[]
  value: ColumnView
  onChange: (view: ColumnView) => void

  /**
   * Columns in each category view.
   */
  counts: Partial<Record<ColumnView, number>>
}

function viewLabel(view: ColumnView): string {
  return view === 'overview' ? 'Overview' : view === 'all' ? 'All columns' : CATEGORY_META[view].label
}

/**
 * One tab per column category, so a wide table shows one group at a time.
 *
 * Below xl the tabs are icons only (spread evenly on phones), since the widest
 * tables' labels don't fit before that; the label stays for screen readers and
 * as a hover title. Counts wait for 2xl for the same reason.
 */
export function ColumnViewTabs({ views, value, onChange, counts }: Props) {
  return (
    <Tabs value={value} onValueChange={next => onChange(next as ColumnView)}>
      {/* Scrolls sideways if the labels still don't fit. */}
      <TabsList className="-mx-6 overflow-x-auto px-6 [scrollbar-width:none] sm:mx-0 sm:px-0">
        {views.map((view) => {
          const label = viewLabel(view)
          const iconClass = 'size-4 xl:size-3.5'

          return (
            <TabsTab
              key={view}
              value={view}
              title={label}
              className="inline-flex flex-1 items-center justify-center gap-1.5 px-2 md:flex-none md:px-4 xl:px-3"
            >
              {view === 'overview' && <LayoutGrid className={iconClass} />}
              {view === 'all' && <Columns3 className={iconClass} />}
              {view !== 'overview' && view !== 'all' && <CategoryIcon category={view} className={iconClass} />}
              <span className="sr-only xl:not-sr-only">{label}</span>
              {counts[view] != null && (
                <span className="text-muted-foreground/70 hidden text-xs tabular-nums 2xl:inline">{counts[view]}</span>
              )}
            </TabsTab>
          )
        })}
      </TabsList>
    </Tabs>
  )
}
