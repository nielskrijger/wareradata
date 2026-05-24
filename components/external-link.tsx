import type { ReactNode } from 'react'

import { ExternalLink as ExternalLinkIcon } from 'lucide-react'

interface Props {
  href: string
  children: ReactNode
}

/**
 * Anchor that opens in a new tab and appends a small external-link icon as a
 * visual cue. For links to app.warera.io, build the href with `wareraUrl()`
 * from `lib/warera/urls.ts`.
 */
export function ExternalLink({ href, children }: Props) {
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
