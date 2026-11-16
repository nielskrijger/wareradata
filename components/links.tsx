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
 * Opens in a new tab with an external-link icon. Build app.warera.io hrefs
 * with `wareraUrl()`.
 *
 * Without `children` it renders the icon alone, muted, for when the text
 * beside it is a separate in-app link.
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
