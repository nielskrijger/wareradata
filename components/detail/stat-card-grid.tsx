import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
}

/**
 * Responsive grid for the detail pages' StatCards. Steps from a single column
 * on phones to 2 from `sm` up, then on to 6 on very wide screens (fewer per
 * row = wider cards). The single mobile column keeps each card full width so
 * the detail pages read as a clean vertical stack on small screens.
 *
 * Dense flow so a later single-width card backfills any hole left when two
 * `sm:col-span-2` headline cards (points + readiness) can't share a row at the
 * 3-column breakpoint. Only kicks in where a gap would otherwise appear.
 */
export function StatCardGrid({ children }: Props) {
  return (
    <section className="grid grid-flow-row-dense grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6">
      {children}
    </section>
  )
}
