import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

interface Props {
  children: ReactNode
  className?: string
}

/**
 * Muted prose, lifted a little in dark mode so long copy stays readable.
 */
export function Paragraph({ children, className }: Props) {
  return (
    <p className={cn('text-muted-foreground dark:text-foreground/70 text-sm', className)}>
      {children}
    </p>
  )
}
