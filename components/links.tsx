import type { ReactNode } from 'react'

import { ExternalLink as ExternalLinkIcon } from 'lucide-react'
import Link from 'next/link'

import { linkClass } from '@/components/link-class'
import { cn } from '@/lib/utils'

interface InternalLinkProps {
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
 * In-app link styled with the shared {@link linkClass}. Use this for any
 * navigation within the site. Pairs with {@link ExternalLink} for out-of-site
 * URLs.
 */
export function InternalLink({ href, children, bold, title, className }: InternalLinkProps) {
  return (
    <Link
      href={href}
      title={title}
      className={cn(linkClass, bold && 'font-medium', className)}
    >
      {children}
    </Link>
  )
}

interface ExternalLinkProps {
  href: string
  /**
   * Visible link text rendered before the icon. Omit for an icon-only link
   * (in which case `label` is required for the aria-label).
   */
  children?: ReactNode
  /**
   * Aria label for icon-only links (used when `children` is omitted).
   * Ignored when `children` is present.
   */
  label?: string
}

/**
 * Anchor that opens in a new tab and appends a small external-link icon as a
 * visual cue. For links to app.warera.io, build the href with `wareraUrl()`
 * from `lib/warera/urls.ts`.
 *
 * Two modes:
 * - With `children`: text + icon styled like {@link InternalLink} (blue,
 *   hover-underline).
 * - Without `children` (pass `label` instead): icon-only, muted — for when
 *   the surrounding text is a separate in-app link and the icon is just the
 *   "open externally" affordance.
 */
export function ExternalLink({ href, children, label }: ExternalLinkProps) {
  if (children === undefined) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={label}
        className="text-muted-foreground hover:text-foreground"
      >
        <ExternalLinkIcon className="h-3 w-3" />
      </a>
    )
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn('inline-flex items-center gap-1', linkClass)}
    >
      {children}
      <ExternalLinkIcon className="text-muted-foreground h-3 w-3" />
    </a>
  )
}
