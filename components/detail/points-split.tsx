import { POINTS_LEGEND } from '@/components/points-breakdown-legend'
import { StackedBar } from '@/components/stacked-bar'
import { formatNumber } from '@/lib/format'
import { cn } from '@/lib/utils'

interface Props {
  total: number
  level: number
  damage: number
  wealth: number
  className?: string
}

/**
 * Where a player's points come from, as one bar with a legend, largest first.
 */
export function PointsSplit({ total, level, damage, wealth, className }: Props) {
  const slices = [
    { label: 'Level' as const, value: level },
    { label: 'Damage' as const, value: damage },
    { label: 'Wealth' as const, value: wealth },
  ].sort((a, b) => b.value - a.value)

  return (
    <div className={cn('space-y-1.5', className)}>
      <StackedBar
        className="bg-muted h-2"
        total={total}
        segments={slices.map(s => ({ key: s.label, value: s.value, color: POINTS_LEGEND[s.label].color }))}
      />
      <div className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-0.5 text-xs tabular-nums">
        {slices.map((s) => {
          const { color, icon: Icon } = POINTS_LEGEND[s.label]

          return (
            <span key={s.label} className="inline-flex items-center gap-1">
              <Icon className="size-3" style={{ color }} />
              {s.label}
              <span className="text-foreground">{formatNumber(s.value)}</span>
              ({total > 0 ? Math.round((s.value / total) * 100) : 0}%)
            </span>
          )
        })}
      </div>
    </div>
  )
}
