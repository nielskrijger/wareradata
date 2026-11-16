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
   * Columns each category view adds beyond the pinned ones.
   */
  counts: Partial<Record<ColumnView, number>>
}

/**
 * One tab per column category, so a wide table shows one group at a time.
 */
export function ColumnViewTabs({ views, value, onChange, counts }: Props) {
  return (
    <Tabs value={value} onValueChange={next => onChange(next as ColumnView)}>
      {/* Scrolls sideways on phones rather than wrapping. */}
      <TabsList className="-mx-6 overflow-x-auto px-6 [scrollbar-width:none] sm:mx-0 sm:px-0">
        {views.map(view => (
          <TabsTab key={view} value={view} className="inline-flex items-center gap-1.5">
            {view === 'overview' && <LayoutGrid className="size-3.5" />}
            {view === 'all' && <Columns3 className="size-3.5" />}
            {view !== 'overview' && view !== 'all' && <CategoryIcon category={view} />}
            {view === 'overview' ? 'Overview' : view === 'all' ? 'All columns' : CATEGORY_META[view].label}
            {counts[view] != null && (
              <span className="text-muted-foreground/70 text-xs tabular-nums">{counts[view]}</span>
            )}
          </TabsTab>
        ))}
      </TabsList>
    </Tabs>
  )
}
