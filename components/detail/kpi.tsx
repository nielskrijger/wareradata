import type { ReactNode } from 'react'

import { PointsSplit } from '@/components/detail/points-split'
import { formatNumber, topPercent } from '@/lib/format'

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
 * One headline number in a detail page's KPI strip.
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
          {rank != null && `#${formatNumber(rank)}`}
          {rank != null && total != null && (
            <span className="text-muted-foreground/60">{` (${topPercent(rank, total)})`}</span>
          )}
        </span>
      )}
    </div>
  )
}

/**
 * The row of headline numbers atop a detail page, with the points split
 * across the bottom.
 */
export function KpiStrip({ points, children }: {
  points: { total: number, level: number, damage: number, wealth: number }
  children: ReactNode
}) {
  return (
    <section className="bg-card grid grid-cols-2 gap-4 rounded-md border p-4 sm:p-5 xl:grid-cols-4">
      {children}
      <PointsSplit className="col-span-full" {...points} />
    </section>
  )
}
