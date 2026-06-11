import type { WareraEntityKind } from '@/lib/warera/urls'

import { ExternalLink } from 'lucide-react'

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { wareraUrl } from '@/lib/warera/urls'

interface Props {
  kind: WareraEntityKind
  id: string
}

/**
 * The small external-link icon at the right edge of a table's primary name cell
 * that opens the entity on WarEra.io (replacing the standalone "Link" column).
 * The name itself keeps its in-app navigation; only this icon goes external.
 * `ml-auto` pins it to the right of the (cell-width) name flex row.
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
