'use client'

import type { ReactNode } from 'react'

import type { ColumnView } from './column-views'

import { Columns3, LayoutGrid } from 'lucide-react'
import { Fragment } from 'react'

import { Tabs, TabsList, TabsTab } from '@/components/ui/tabs'

import { cn } from '@/lib/utils'
import { CategoryIcon } from './category-icon'

import { CATEGORY_META } from './column-categories'

export interface ExtraTab {
  id: string
  label: string
  icon: ReactNode
  content: ReactNode
}

interface Props {
  views: ColumnView[]
  value: string
  onChange: (view: string) => void

  /**
   * Columns in each category view.
   */
  counts: Partial<Record<ColumnView, number>>

  /**
   * Shown after the first view, with a divider before the column views since
   * it shows other rows rather than other columns.
   */
  extraTab?: Pick<ExtraTab, 'id' | 'label' | 'icon'>
}

const TAB_CLASS = 'inline-flex flex-1 items-center justify-center gap-1.5 px-2 md:flex-none md:px-4 xl:px-3'
const ICON_CLASS = 'size-4 xl:size-3.5'

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
export function ColumnViewTabs({ views, value, onChange, counts, extraTab }: Props) {
  return (
    <Tabs value={value} onValueChange={next => onChange(next as string)}>
      {/* Scrolls sideways if the labels still don't fit. */}
      <TabsList className="-mx-6 overflow-x-auto px-6 [scrollbar-width:none] sm:mx-0 sm:px-0">
        {views.map((view, index) => {
          const label = viewLabel(view)

          return (
            <Fragment key={view}>
              <TabsTab value={view} title={label} className={TAB_CLASS}>
                {view === 'overview' && <LayoutGrid className={ICON_CLASS} />}
                {view === 'all' && <Columns3 className={ICON_CLASS} />}
                {view !== 'overview' && view !== 'all' && <CategoryIcon category={view} className={ICON_CLASS} />}
                <span className="sr-only xl:not-sr-only">{label}</span>
                {counts[view] != null && (
                  <span className="text-muted-foreground/70 hidden text-xs tabular-nums 2xl:inline">
                    {counts[view]}
                  </span>
                )}
              </TabsTab>
              {index === 0 && extraTab && (
                <>
                  <TabsTab value={extraTab.id} title={extraTab.label} className={TAB_CLASS}>
                    <span className={cn(ICON_CLASS, 'inline-flex [&>svg]:size-full')}>{extraTab.icon}</span>
                    {/* Labelled from sm up, before the column views are, so it reads as another table. */}
                    <span className="sr-only sm:not-sr-only">{extraTab.label}</span>
                  </TabsTab>
                  <span aria-hidden className="bg-border mx-1 h-5 w-px shrink-0" />
                </>
              )}
            </Fragment>
          )
        })}
      </TabsList>
    </Tabs>
  )
}
