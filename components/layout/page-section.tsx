import type { ReactNode } from 'react'

/**
 * A titled block of a page below its header (Members, Government, …).
 */
export function PageSection({ title, children }: { title: string, children: ReactNode }) {
  return (
    <section className="min-w-0 space-y-3">
      <h2 className="font-brand text-lg tracking-wide">{title}</h2>
      {children}
    </section>
  )
}
