interface Props {
  total: number
  level: number
  damage: number
  wealth: number
  pointsPerDay?: number | null
}

// Level / Damage / Wealth slice colors. Distinct hues (blue/red/green) so the
// three contributions read at a glance.
const SLICE_COLORS = {
  Level: 'oklch(0.62 0.17 250)',
  Damage: 'oklch(0.63 0.21 27)',
  Wealth: 'oklch(0.7 0.16 145)',
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
        <div className="text-muted-foreground text-xs">Total points</div>
        <div className="text-4xl leading-tight tabular-nums">{total.toLocaleString()}</div>
        {pointsPerDay != null && (
          <div className="text-muted-foreground text-xs">{pointsPerDay.toLocaleString()} points/day</div>
        )}
      </div>
      <dl className="space-y-2">
        {slices.map((s) => {
          const pct = total > 0 ? Math.round((s.value / total) * 100) : 0
          const color = SLICE_COLORS[s.label]
          return (
            <div key={s.label} className="grid grid-cols-[5rem_1fr_auto] items-center gap-3">
              <dt className="flex items-center gap-2 text-sm">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ background: color }} />
                {s.label}
              </dt>
              <div className="bg-muted h-2 overflow-hidden rounded-full">
                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
              </div>
              <dd className="text-right text-sm tabular-nums">
                {s.value.toLocaleString()}
                {' '}
                <span className="text-muted-foreground">
                  (
                  {pct}
                  %)
                </span>
              </dd>
            </div>
          )
        })}
      </dl>
    </section>
  )
}
