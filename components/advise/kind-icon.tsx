import type { AdviseRow } from './rows'

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { KIND } from './format'

/**
 * The kind of action as a tinted icon tile, named on hover.
 */
export function KindIcon({ kind, small }: { kind: AdviseRow['kind'], small?: boolean }) {
  const { label, color, icon: Icon } = KIND[kind]

  return (
    <Tooltip>
      <TooltipTrigger
        render={(
          <span
            aria-label={label}
            className={cn('flex shrink-0 items-center justify-center rounded-md', small ? 'size-5' : 'size-7')}
            style={{ background: `color-mix(in oklch, ${color} 18%, transparent)`, color }}
          />
        )}
      >
        <Icon aria-hidden className={small ? 'size-3' : 'size-4'} />
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}
