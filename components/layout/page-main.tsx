import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

import { PAGE_GUTTER } from './page-gutter'

const WIDTHS = {
  // Fills the site column (`max-w-site`) the layout already caps.
  wide: '',
  // Card lists such as Advise.
  medium: 'mx-auto w-full max-w-6xl',
  // Prose: a readable line length, centred.
  text: 'mx-auto w-full max-w-3xl',
}

export type PageWidth = keyof typeof WIDTHS

/**
 * Every page's `<main>`, so gutters and widths match across the app.
 */
export function PageMain({ width = 'wide', className, children, ...props }: {
  'width'?: PageWidth
  'className'?: string
  'children': ReactNode
  'aria-busy'?: boolean
}) {
  return (
    <main className={cn(PAGE_GUTTER, 'py-8', WIDTHS[width], className)} {...props}>
      {children}
    </main>
  )
}
