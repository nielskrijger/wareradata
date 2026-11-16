import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

/**
 * Every page's `<main>`, so the side gutters match across the app.
 */
export function PageMain({ className, children, ...props }: {
  'className'?: string
  'children': ReactNode
  'aria-busy'?: boolean
}) {
  return <main className={cn('px-6 py-8 sm:px-8 lg:px-12', className)} {...props}>{children}</main>
}
