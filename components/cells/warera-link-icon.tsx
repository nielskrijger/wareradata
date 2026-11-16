import type { WareraEntityKind } from '@/lib/warera/urls'

import { ExternalLink } from 'lucide-react'

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { wareraUrl } from '@/lib/warera/urls'

interface Props {
  kind: WareraEntityKind
  id: string
}

/**
 * Opens the entity on WarEra.io; the name beside it stays in-app.
 */
export function WareraLinkIcon({ kind, id }: Props) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={(
          <a
            href={wareraUrl(kind, id)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open on WarEra.io"
            className="text-muted-foreground/50 hover:text-foreground ml-auto shrink-0 cursor-pointer"
          />
        )}
      >
        <ExternalLink className="size-3.5" />
      </TooltipTrigger>
      <TooltipContent>Open on WarEra.io</TooltipContent>
    </Tooltip>
  )
}
