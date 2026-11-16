'use client'

import type { ReactNode } from 'react'

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

interface Props {
  rank: number | null | undefined
  children: ReactNode
}

/**
 * Wraps a value-cell render (e.g. CompactNumber for wealth) and surfaces its
 * companion rank as a hover tooltip, so a table shows the rank without a
 * separate rank column.
 *
 * Rank is always the snapshot-global rank, not relative to the current filter.
 * If `rank` is null the children render bare with no tooltip trigger.
 */
export function ValueWithRankTooltip({ rank, children }: Props) {
  if (rank == null) {
    return <>{children}</>
  }

  return (
    <Tooltip>
      <TooltipTrigger render={<span className="hover:text-foreground cursor-default" />}>
        {children}
      </TooltipTrigger>
      <TooltipContent side="top">
        Rank #
        {rank.toLocaleString()}
      </TooltipContent>
    </Tooltip>
  )
}
