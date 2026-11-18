import type { ReactNode } from 'react'

import { formatRank, topPercent } from '@/lib/format'

interface Props {
  label: string
  icon?: ReactNode
  value: ReactNode

  /**
   * A muted note under the value, before the rank (e.g. "928/day").
   */
  sub?: ReactNode

  /**
   * Leaderboard position, shown with its percentile of `total`.
   */
  rank?: number | null
  total?: number
}

/**
 * One headline number with its label and an optional rank.
 */
export function Kpi({ label, icon, value, sub, rank, total }: Props) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <span className="text-muted-foreground inline-flex items-center gap-1.5 text-xs [&>svg]:size-3.5">
        {icon}
        {label}
      </span>
      <span className="text-2xl leading-tight tabular-nums">{value}</span>
      {(sub || rank != null) && (
        <span className="text-muted-foreground text-xs tabular-nums">
          {sub}
          {sub && rank != null && ' · '}
          {rank != null && formatRank(rank)}
          {rank != null && total != null && (
            <span className="text-muted-foreground/60">{` (${topPercent(rank, total)})`}</span>
          )}
        </span>
      )}
    </div>
  )
}
