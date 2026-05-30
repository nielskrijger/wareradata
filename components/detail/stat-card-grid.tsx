import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
}

/**
 * Responsive grid for the detail pages' StatCards. Steps from 2 columns on
 * phones up to 6 on very wide screens (fewer per row = wider cards).
 */
export function StatCardGrid({ children }: Props) {
  return (
    <section className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6">
      {children}
    </section>
  )
}
