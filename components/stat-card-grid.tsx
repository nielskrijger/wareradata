import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
}

/**
 * Responsive grid for the detail pages' StatCards. Steps from 2 columns on
 * phones up to 8 on very wide screens.
 */
export function StatCardGrid({ children }: Props) {
  return (
    <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8">
      {children}
    </section>
  )
}
