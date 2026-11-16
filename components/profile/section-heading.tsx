import type { ReactNode } from 'react'

/**
 * The small caps title of a profile sidebar section, with an optional control
 * or figure on the right.
 */
export function SectionHeading({ title, aside }: { title: string, aside?: ReactNode }) {
  return (
    <div className="flex min-h-6 items-center justify-between gap-2">
      <h2 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{title}</h2>
      {aside}
    </div>
  )
}
