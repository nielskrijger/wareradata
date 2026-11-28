'use client'

import type { ReactNode } from 'react'

import { useLayoutEffect, useRef } from 'react'

import { Tabs, TabsList, TabsTab } from '@/components/ui/tabs'
import { formatNumber } from '@/lib/format'
import { cn } from '@/lib/utils'

/**
 * What the tabs show, most first. Matched by the `tab-labels` and `tab-counts`
 * variants in globals.css.
 */
const FITS = ['counts', 'labels', 'icons'] as const

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

interface Props {
  value: string
  onChange: (value: string) => void

  /**
   * The tab ids, so the row re-measures when they change.
   */
  ids: string[]
  children: ReactNode
}

/**
 * A row of {@link FitTab}s that shows labels, and then counts, only while the
 * whole row fits them; otherwise just icons (spread evenly on phones).
 */
export function FitTabs({ value, onChange, ids, children }: Props) {
  const ref = useFit(ids.join())

  return (
    <Tabs value={value} onValueChange={next => onChange(next as string)}>
      {/* Scrolls sideways only if even the icons don't fit. */}
      <TabsList ref={ref} className="-mx-6 overflow-x-auto px-6 [scrollbar-width:none] sm:mx-0 sm:px-0">
        {children}
      </TabsList>
    </Tabs>
  )
}

interface TabProps {
  value: string
  label: string
  icon: ReactNode
  count?: number

  /**
   * Labels the tab from sm up even when the row only fits icons.
   */
  labelFromSm?: boolean
}

/**
 * One tab of {@link FitTabs}. The label stays for screen readers and as a
 * hover title when only the icon shows.
 */
export function FitTab({ value, label, icon, count, labelFromSm }: TabProps) {
  return (
    <TabsTab
      value={value}
      title={label}
      className="inline-flex flex-1 items-center justify-center gap-1.5 px-2 md:flex-none md:px-4 tab-labels:px-3"
    >
      <span className="inline-flex size-4 shrink-0 tab-labels:size-3.5 [&>svg]:size-full">{icon}</span>
      <span className={cn('sr-only tab-labels:not-sr-only', labelFromSm && 'sm:not-sr-only')}>{label}</span>
      {count != null && (
        <span className="text-muted-foreground/70 hidden text-xs tabular-nums tab-counts:inline">
          {formatNumber(count)}
        </span>
      )}
    </TabsTab>
  )
}
