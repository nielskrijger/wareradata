'use client'

import type { ReactNode } from 'react'

import type { ColumnView } from './column-views'

import { Columns3, LayoutGrid } from 'lucide-react'
import { Fragment } from 'react'

import { FitTab, FitTabs } from '@/components/fit-tabs'

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

function viewLabel(view: ColumnView): string {
  return view === 'overview' ? 'Overview' : view === 'all' ? 'All columns' : CATEGORY_META[view].label
}

function viewIcon(view: ColumnView): ReactNode {
  return view === 'overview' ? <LayoutGrid /> : view === 'all' ? <Columns3 /> : <CategoryIcon category={view} />
}

/**
 * One tab per column category, so a wide table shows one group at a time.
 */
export function ColumnViewTabs({ views, value, onChange, counts, extraTab }: Props) {
  return (
    <FitTabs value={value} onChange={onChange} ids={[...views, extraTab?.id ?? '']}>
      {views.map((view, index) => (
        <Fragment key={view}>
          <FitTab value={view} label={viewLabel(view)} icon={viewIcon(view)} count={counts[view]} />
          {index === 0 && extraTab && (
            <>
              {/* Labelled before the column views are, so it reads as another table. */}
              <FitTab value={extraTab.id} label={extraTab.label} icon={extraTab.icon} labelFromSm />
              <span aria-hidden className="bg-border mx-1 h-5 w-px shrink-0" />
            </>
          )}
        </Fragment>
      ))}
    </FitTabs>
  )
}
