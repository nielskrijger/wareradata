import type { ReactNode } from 'react'

import type { BarSegment } from '@/components/stacked-bar'

import { StackedBar } from '@/components/stacked-bar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

interface Props {
  segments: BarSegment[]

  /**
   * Bar track width in px.
   */
  width: number

  /**
   * The breakdown shown on hover.
   */
  children: ReactNode

  /**
   * Classes for the tooltip popup (width, padding).
   */
  tooltipClassName?: string
}

/**
 * A table cell's thin stacked bar with its breakdown on hover.
 */
export function StackedBarCell({ segments, width, children, tooltipClassName }: Props) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={(
          // Pad vertically so the hover/hit area covers the row height, not
          // just the 1.5px-tall bar.
          <div className="flex cursor-default items-center py-2" style={{ width }}>
            <StackedBar className="h-1.5 w-full bg-white/10" segments={segments} />
          </div>
        )}
      />
      <TooltipContent align="end" side="top" className={tooltipClassName}>{children}</TooltipContent>
    </Tooltip>
  )
}
