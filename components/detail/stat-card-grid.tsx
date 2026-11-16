import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
}

/**
 * Responsive grid for the detail StatCards.
 *
 * Dense flow so a single-width card backfills the hole left when two
 * `sm:col-span-2` cards can't share a row.
 */
export function StatCardGrid({ children }: Props) {
  return (
    <section
      className="grid grid-flow-row-dense grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6"
    >
      {children}
    </section>
  )
}
