import { cn } from '@/lib/utils'

import { goldSigned, humanizeItem, netClass } from './format'

interface Props {
  className?: string
  // Net/day; auto + workers sum to total.
  totalNet: number
  autoNet: number
  workersNet: number
  count: number
  // Active-factory count, when known (the live view has it; the snapshot doesn't).
  activeCount?: number
  // The globally most profitable item right now, when known.
  bestItem?: string
  bestRegion?: string
}

/**
 * A glance-level summary of a user's factory portfolio: the combined net/day and
 * its split into automated engines vs hired workers, as three equal columns
 * (Total emphasized). Fed from the snapshot's per-user aggregates so it renders
 * instantly alongside the other detail cards; the per-factory detail lives in the
 * table further down. `activeCount` / `bestItem` are shown only when supplied.
 */
export function FactoryStatsCard({ className, totalNet, autoNet, workersNet, count, activeCount, bestItem, bestRegion }: Props) {
  const countLabel = activeCount != null
    ? `${activeCount}/${count} active`
    : `${count.toLocaleString()} ${count === 1 ? 'factory' : 'factories'}`

  return (
    <div className={cn('bg-card flex flex-col gap-3 rounded-md border p-3', className)}>
      <span className="text-sm font-medium">Factories</span>

      <div className="divide-border grid grid-cols-3 divide-x">
        <Col label="Total / day" value={totalNet} sub={countLabel} strong />
        <Col label="Auto / day" value={autoNet} pad />
        <Col label="Workers / day" value={workersNet} pad />
      </div>

      {bestItem && (
        <span className="text-muted-foreground text-xs">
          Best item now <span className="text-foreground font-medium">{humanizeItem(bestItem)}</span>
          {bestRegion && <>{' in '}{bestRegion}</>}
        </span>
      )}
    </div>
  )
}

/**
 * One net/day column: label, the value (colored by sign), and an optional sub.
 * `strong` enlarges the headline Total; `pad` insets the columns after the first
 * so they clear the vertical divider.
 */
function Col({ label, value, sub, strong, pad }: { label: string, value: number, sub?: string, strong?: boolean, pad?: boolean }) {
  return (
    <div className={cn('flex flex-col gap-0.5', pad && 'pl-3')}>
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className={cn('tabular-nums', strong ? 'text-xl font-semibold' : 'text-base font-medium', netClass(value))}>
        {goldSigned(value)}
      </span>
      {sub && <span className="text-muted-foreground text-[11px] tabular-nums">{sub}</span>}
    </div>
  )
}
