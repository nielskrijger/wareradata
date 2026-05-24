import type { ReactNode } from 'react'

import { ExternalLink as ExternalLinkIcon } from 'lucide-react'

interface Props {
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
 * - With `children`: text + icon, both clickable.
 * - Without `children` (pass `label` instead): icon-only — useful when the
 *   surrounding text is a separate in-app link and the icon is just the
 *   "open externally" affordance.
 */
export function ExternalLink({ href, children, label }: Props) {
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
      className="hover:text-foreground inline-flex items-center gap-1 hover:underline"
    >
      {children}
      <ExternalLinkIcon className="text-muted-foreground h-3 w-3" />
    </a>
  )
}
