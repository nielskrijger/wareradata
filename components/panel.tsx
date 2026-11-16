import type { ComponentProps } from 'react'

import { cn } from '@/lib/utils'

const PADDING = {
  none: '',
  sm: 'p-3',
  md: 'p-4 sm:p-5',
}

interface Props extends ComponentProps<'div'> {
  as?: 'div' | 'section' | 'aside'

  /**
   * `sm` for compact cards sitting side by side; `none` when the content
   * runs to the edges (a table, a header banner).
   */
  padding?: keyof typeof PADDING
}

/**
 * The card surface every page block sits on.
 */
export function Panel({ as: Tag = 'div', padding = 'md', className, ...props }: Props) {
  return <Tag className={cn('bg-card rounded-md border', PADDING[padding], className)} {...props} />
}
