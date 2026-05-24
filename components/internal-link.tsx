import type { ReactNode } from 'react'

import Link from 'next/link'

import { cn } from '@/lib/utils'

interface Props {
  href: string
  children: ReactNode
  bold?: boolean
  /**
   * Native browser tooltip. Useful when the visible text is truncated.
   */
  title?: string
  className?: string
}

/**
 * In-app link with a faint always-on underline so it reads as a link at
 * rest, strengthening on hover. Pairs with `ExternalLink` (which is for
 * out-of-site URLs and adds an icon).
 */
export function InternalLink({ href, children, bold, title, className }: Props) {
  return (
    <Link
      href={href}
      title={title}
      className={cn(
        'text-blue-600 hover:text-blue-800 hover:underline',
        bold && 'font-medium',
        className,
      )}
    >
      {children}
    </Link>
  )
}
