'use client'

import type { ReactNode } from 'react'

import type { ColumnView } from './column-views'

import { Columns3, LayoutGrid } from 'lucide-react'
import { Fragment, useLayoutEffect, useRef } from 'react'

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

const TAB_CLASS = 'inline-flex flex-1 items-center justify-center gap-1.5 px-2 md:flex-none md:px-4 tab-labels:px-3'
const ICON_CLASS = 'size-4 tab-labels:size-3.5'

/**
 * What the tabs show, most first. Matched by the `tab-labels` and `tab-counts`
 * variants in globals.css.
 */
const FITS = ['counts', 'labels', 'icons'] as const

function viewLabel(view: ColumnView): string {
  return view === 'overview' ? 'Overview' : view === 'all' ? 'All columns' : CATEGORY_META[view].label
}

/**
 * Sets `data-fit` on the list to the most the row shows without scrolling,
 * whenever its width, its tabs or the font change. Written to the DOM rather
 * than to state, so trying each level costs a layout, not a render.
 */
function useFit(tabs: string) {
  const ref = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const list = ref.current
    if (!list) {
      return
    }

    const fit = () => {
      for (const level of FITS) {
        list.dataset.fit = level
        if (list.scrollWidth <= list.clientWidth) {
          return
        }
      }
    }

    const observer = new ResizeObserver(fit)
    observer.observe(list)
    void document.fonts.ready.then(fit)

    return () => observer.disconnect()
  }, [tabs])

  return ref
}

/**
 * One tab per column category, so a wide table shows one group at a time.
 *
 * The tabs show labels, and then counts, only while the whole row fits them;
 * otherwise just icons (spread evenly on phones). The label stays for screen
 * readers and as a hover title.
 */
export function ColumnViewTabs({ views, value, onChange, counts, extraTab }: Props) {
  const ref = useFit([...views, extraTab?.id].join())

  return (
    <Tabs value={value} onValueChange={next => onChange(next as string)}>
      {/* Scrolls sideways only if even the icons don't fit. */}
      <TabsList ref={ref} className="-mx-6 overflow-x-auto px-6 [scrollbar-width:none] sm:mx-0 sm:px-0">
        {views.map((view, index) => {
          const label = viewLabel(view)

          return (
            <Fragment key={view}>
              <TabsTab value={view} title={label} className={TAB_CLASS}>
                {view === 'overview' && <LayoutGrid className={ICON_CLASS} />}
                {view === 'all' && <Columns3 className={ICON_CLASS} />}
                {view !== 'overview' && view !== 'all' && <CategoryIcon category={view} className={ICON_CLASS} />}
                <span className="sr-only tab-labels:not-sr-only">{label}</span>
                {counts[view] != null && (
                  <span className="text-muted-foreground/70 hidden text-xs tabular-nums tab-counts:inline">
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
