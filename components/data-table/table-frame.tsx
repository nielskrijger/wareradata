import type { ComponentProps } from 'react'

import { cn } from '@/lib/utils'

/**
 * The bordered card around a table.
 *
 * Full-bleed on mobile so the scrolling table gets the whole width; the side
 * borders and rounding come back from sm up.
 */
export function TableFrame({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'border-input bg-card overflow-hidden border dark:bg-input/50',
        '-mx-6 rounded-none border-x-0 sm:mx-0 sm:rounded-md sm:border-x',
        className,
      )}
      {...props}
    />
  )
}
