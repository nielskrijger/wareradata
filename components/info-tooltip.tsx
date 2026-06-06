'use client'

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface Props {
  label: string
  hint: string
  // Override the trigger styling. Defaults to a brighten-on-hover (the app's
  // standard tooltip-trigger affordance); cells may add e.g.
  // `text-muted-foreground cursor-default`.
  className?: string
}

/**
 * Text with a hover tooltip explaining it. The trigger is a span (not a
 * button) so it can sit inside other interactive elements — e.g. the
 * DataTable's sort button in a column header — without nesting buttons.
 */
export function InfoTooltip({ label, hint, className }: Props) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={(
          <span className={cn('hover:text-foreground', className)} />
        )}
      >
        {label}
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-56">
        {hint}
      </TooltipContent>
    </Tooltip>
  )
}
