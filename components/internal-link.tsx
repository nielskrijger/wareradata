import type { ReactNode } from 'react'

import Link from 'next/link'

import { cn } from '@/lib/utils'

interface Props {
  href: string
  children: ReactNode
  /**
   * Render the link text in medium weight. Use sparingly — meant for the
   * primary identifier in a row (e.g. MU name).
   */
  bold?: boolean
  className?: string
}

/**
 * In-app link with a faint always-on underline so it reads as a link at
 * rest, strengthening on hover. Pairs with `ExternalLink` (which is for
 * out-of-site URLs and adds an icon).
 */
export function InternalLink({ href, children, bold, className }: Props) {
  return (
    <Link
      href={href}
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
