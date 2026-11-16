'use client'

import type { ReactNode } from 'react'

import { TooltipHeading, TooltipRow } from '@/components/cells/tooltip-ledger'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

interface Props {
  rank: number | null | undefined

  /**
   * What the value is, as the tooltip heading (e.g. "Wealth").
   */
  label: string

  /**
   * The value written out in full, since the cell may show it compacted.
   */
  value: ReactNode
  children: ReactNode
}

/**
 * Wraps a value-cell render (e.g. CompactNumber for wealth) and surfaces its
 * full value and companion rank as a hover tooltip, so a table shows the rank
 * without a separate rank column.
 *
 * Rank is always the snapshot-global rank, not relative to the current filter.
 * If `rank` is null the children render bare with no tooltip trigger.
 */
export function ValueWithRankTooltip({ rank, label, value, children }: Props) {
  if (rank == null) {
    return <>{children}</>
  }

  return (
    <Tooltip>
      <TooltipTrigger render={<span className="hover:text-foreground cursor-default" />}>
        {children}
      </TooltipTrigger>
      <TooltipContent side="top">
        <div className="min-w-40">
          <TooltipHeading label={label}>{value}</TooltipHeading>
          <TooltipRow label="Rank">#{rank.toLocaleString()}</TooltipRow>
        </div>
      </TooltipContent>
    </Tooltip>
  )
}
