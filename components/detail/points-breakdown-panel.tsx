import { Trophy } from 'lucide-react'

import { POINTS_LEGEND } from '@/components/points-breakdown-legend'
import { StackedBar } from '@/components/stacked-bar'
import { cn } from '@/lib/utils'

interface Props {
  total: number
  level: number
  damage: number
  wealth: number
  // Optional figure under the total: a per-day rate (user) or a per-capita
  // average (a country's points/citizen, an MU's points/member). Hidden when
  // the value is null.
  caption?: { value: number | null, unit: string }
  // Grid placement from the caller (e.g. `sm:col-span-2`), since this sits as
  // the headline cell inside the detail page's StatCardGrid.
  className?: string
}

/**
 * The detail pages' points card body: the total on the left, then the three
 * score contributions (level, damage, wealth) on the right, sorted highest
 * first, each as a labeled bar with its value and share of the total.
 *
 * Unlike the table's PointsBreakdownCell (a hover tooltip), this shows the
 * breakdown inline since the detail page has the room for it.
 */
export function PointsBreakdownPanel({ total, level, damage, wealth, caption, className }: Props) {
  const slices = [
    { label: 'Level' as const, value: level },
    { label: 'Damage' as const, value: damage },
    { label: 'Wealth' as const, value: wealth },
  ].sort((a, b) => b.value - a.value)

  return (
    <section className={cn('bg-card grid grid-cols-1 gap-6 rounded-md border p-3 sm:grid-cols-[auto_1fr] sm:items-center', className)}>
      <div className="sm:border-r sm:pr-6">
        <div className="text-muted-foreground inline-flex items-center gap-1.5 text-xs">
          <Trophy className="size-3.5" />
          Total points
        </div>
        <div className="text-2xl leading-tight tabular-nums">{total.toLocaleString()}</div>
        {caption?.value != null && (
          <div className="text-muted-foreground text-xs">
            {caption.value.toLocaleString()}
            {' '}
            {caption.unit}
          </div>
        )}
      </div>
      <dl className="space-y-1">
        {slices.map((s) => {
          const pct = total > 0 ? Math.round((s.value / total) * 100) : 0
          const { color, icon: Icon } = POINTS_LEGEND[s.label]
          return (
            <div key={s.label}>
              <div className="flex items-baseline justify-between gap-2 text-sm">
                <dt className="flex items-center gap-2">
                  <Icon className="size-3.5 shrink-0" style={{ color }} />
                  {s.label}
                </dt>
                <dd className="tabular-nums">
                  {s.value.toLocaleString()}
                  {' '}
                  <span className="text-muted-foreground text-xs">
                    (
                    {pct}
                    %)
                  </span>
                </dd>
              </div>
              <StackedBar
                className="mt-0.5 h-1.5 bg-muted"
                total={total}
                segments={[{ key: s.label, value: s.value, color }]}
              />
            </div>
          )
        })}
      </dl>
    </section>
  )
}
