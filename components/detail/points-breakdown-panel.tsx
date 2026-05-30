import { Coins, Swords, TrendingUp, Trophy } from 'lucide-react'

interface Props {
  total: number
  level: number
  damage: number
  wealth: number
  pointsPerDay?: number | null
}

// Level / Damage / Wealth slice colors (distinct hues so the three
// contributions read at a glance) paired with an icon.
const SLICE_META = {
  Level: { color: 'oklch(0.62 0.2 295)', icon: TrendingUp },
  Damage: { color: 'oklch(0.63 0.21 27)', icon: Swords },
  Wealth: { color: 'oklch(0.74 0.15 80)', icon: Coins },
} as const

/**
 * The user page's points card body: the total on the left, then the three
 * score contributions (level, damage, wealth) on the right, sorted highest
 * first, each as a labeled bar with its value and share of the total.
 *
 * Unlike the table's PointsBreakdownCell (a hover tooltip), this shows the
 * breakdown inline since the detail page has the room for it.
 */
export function PointsBreakdownPanel({ total, level, damage, wealth, pointsPerDay }: Props) {
  const slices = [
    { label: 'Level' as const, value: level },
    { label: 'Damage' as const, value: damage },
    { label: 'Wealth' as const, value: wealth },
  ].sort((a, b) => b.value - a.value)

  return (
    <section className="bg-card grid grid-cols-1 gap-6 rounded-md border p-5 sm:grid-cols-[auto_1fr] sm:items-center">
      <div className="sm:border-r sm:pr-6">
        <div className="text-muted-foreground inline-flex items-center gap-1.5 text-xs">
          <Trophy className="size-3.5" />
          Total points
        </div>
        <div className="text-4xl leading-tight tabular-nums">{total.toLocaleString()}</div>
        {pointsPerDay != null && (
          <div className="text-muted-foreground text-xs">{pointsPerDay.toLocaleString()} points/day</div>
        )}
      </div>
      <dl className="space-y-2.5">
        {slices.map((s) => {
          const pct = total > 0 ? Math.round((s.value / total) * 100) : 0
          const { color, icon: Icon } = SLICE_META[s.label]
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
              <div className="bg-muted mt-1 h-2 overflow-hidden rounded-full">
                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
              </div>
            </div>
          )
        })}
      </dl>
    </section>
  )
}
