import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

interface Props {
  children: ReactNode
  className?: string
}

/**
 * Muted body paragraph for long-form prose. Slightly lifted in dark mode
 * (`dark:text-foreground/70`) so multi-sentence copy stays comfortably
 * readable rather than dropping to the dimmer muted-foreground used for
 * one-line labels and captions.
 */
export function Paragraph({ children, className }: Props) {
  return (
    <p className={cn('text-muted-foreground dark:text-foreground/70 text-sm', className)}>
      {children}
    </p>
  )
}
