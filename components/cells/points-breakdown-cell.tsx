'use client'

import type { PointsCategory } from '@/components/points-breakdown-legend'
import { TooltipHeading, TooltipRow } from '@/components/cells/tooltip-ledger'
import { POINTS_LEGEND } from '@/components/points-breakdown-legend'
import { StackedBar } from '@/components/stacked-bar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { formatNumber, formatRank, percentOf } from '@/lib/format'

export interface PointsStat {
  label: string
  value: number | null
}

interface Props {
  total: number
  rank?: number | null
  level: number
  damage: number
  wealth: number
  stats?: PointsStat[]
}

/**
 * Renders a points total in a table cell with a hover tooltip listing its rank
 * and any extra `stats` (averages, rates), then the three contributing slices (level,
 * damage, wealth), each as an icon-led row with its value, percent, and a mini bar.
 */
export function PointsBreakdownCell({ total, rank = null, level, damage, wealth, stats = [] }: Props) {
  const slices = [
    { label: 'Level' as const, value: level },
    { label: 'Damage' as const, value: damage },
    { label: 'Wealth' as const, value: wealth },
  ].sort((a, b) => b.value - a.value)

  const max = Math.max(level, damage, wealth)
  const shownStats = stats.filter((s): s is { label: string, value: number } => s.value !== null)

  return (
    <Tooltip>
      <TooltipTrigger className="hover:text-foreground cursor-default">
        {formatNumber(total)}
      </TooltipTrigger>
      <TooltipContent align="end" side="top" className="w-60 px-3 py-2">
        <TooltipHeading label="Points">{formatNumber(total)}</TooltipHeading>
        {(rank != null || shownStats.length > 0) && (
          <div className="mb-2 space-y-1 border-b border-white/10 pb-2">
            {rank != null && <TooltipRow label="Rank">{formatRank(rank)}</TooltipRow>}
            {shownStats.map(s => <TooltipRow key={s.label} label={s.label}>{formatNumber(s.value)}</TooltipRow>)}
          </div>
        )}
        <dl className="space-y-1.5">
          {slices.map(s => (
            <BreakdownRow key={s.label} label={s.label} value={s.value} total={total} max={max} />
          ))}
        </dl>
      </TooltipContent>
    </Tooltip>
  )
}

interface RowProps {
  label: PointsCategory
  value: number
  total: number
  max: number
}

function BreakdownRow({ label, value, total, max }: RowProps) {
  const pct = percentOf(value, total)
  const { color, icon: Icon } = POINTS_LEGEND[label]

  return (
    <div className="space-y-0.5">
      <div className="flex items-center gap-1.5 tabular-nums">
        <Icon className="size-3 shrink-0" style={{ color }} />
        <span className="flex-1">{label}</span>
        <span>{formatNumber(value)}</span>
        <span className="w-8 text-right opacity-60">
          {pct}
          %
        </span>
      </div>
      <StackedBar
        className="h-1 bg-white/10"
        total={max}
        segments={[{ key: label, value, color }]}
      />
    </div>
  )
}
