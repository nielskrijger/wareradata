import type { FactoryLedgerRow } from '@/lib/factories/ledger'
import type { PortfolioTotals } from '@/lib/factories/profit'

import { StackedBar } from '@/components/stacked-bar'
import { cn } from '@/lib/utils'

import { ENGINE_FILL, goldSigned, netClass } from './format'

interface Props {
  rows: FactoryLedgerRow[]
  totals: PortfolioTotals
}

interface Step {
  label: string
  delta: number
  color: string
}

/**
 * A user's factories as a daily waterfall, summing the same way as the roster
 * below it: engines + employee output − wages − managers = net. Then net as a
 * share of Top potential. Self-work is excluded.
 */
export function FactoryIncome({ rows, totals }: Props) {
  const employees = rows.flatMap(r => r.employees)
  const managers = rows.reduce((s, r) => s + r.managerPerDay, 0)

  const steps: Step[] = [
    { label: 'Engines', delta: rows.reduce((s, r) => s + r.engineNetPerDay, 0), color: ENGINE_FILL },
    ...employees.length > 0
      ? [
          {
            label: 'Employee output',
            delta: employees.reduce((s, e) => s + e.revenuePerDay - e.inputCostPerDay, 0),
            color: 'var(--heat-green)',
          },
          { label: 'Wages', delta: -rows.reduce((s, r) => s + r.wagePerDay, 0), color: 'var(--heat-red)' },
        ]
      : [],
    ...managers >= 0.05 ? [{ label: 'Managers', delta: -managers, color: 'var(--heat-red)' }] : [],
  ]

  // Running totals, so each bar starts where the previous one ended.
  let running = 0
  const bars = steps.map((s) => {
    const from = running
    running += s.delta

    return { ...s, from, to: running }
  })

  const net = totals.netPerDay
  const lo = Math.min(0, net, ...bars.map(b => Math.min(b.from, b.to)))
  const hi = Math.max(0, net, ...bars.map(b => Math.max(b.from, b.to)))
  const span = hi - lo || 1
  const x = (v: number) => ((v - lo) / span) * 100

  const potential = totals.bestPotentialNetPerDay
  const pct = potential > 0 ? Math.max(0, Math.min(100, (net / potential) * 100)) : null

  return (
    <div className="space-y-3">
      <dl className="grid grid-cols-[minmax(6rem,auto)_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 text-sm">
        {bars.map(b => <Bar key={b.label} label={b.label} from={b.from} to={b.to} color={b.color} x={x} />)}
        <Bar label="Net / day" from={0} to={net} color="var(--heat-green)" x={x} strong />
      </dl>

      {pct != null && (
        <div className="space-y-1">
          <div className="text-muted-foreground flex justify-between gap-2 text-xs tabular-nums">
            <span>vs Top potential {goldSigned(potential)}</span>
            <span>{Math.round(pct)}%</span>
          </div>
          <StackedBar
            className="bg-muted h-1.5"
            total={100}
            segments={[{ key: 'net', value: pct, color: 'var(--heat-green)' }]}
          />
        </div>
      )}
    </div>
  )
}

function Bar({ label, from, to, color, x, strong }: {
  label: string
  from: number
  to: number
  color: string
  x: (v: number) => number
  strong?: boolean
}) {
  const left = x(Math.min(from, to))
  const width = Math.max(0.5, x(Math.max(from, to)) - left)

  return (
    <>
      <dt className={cn(strong ? 'font-medium' : 'text-muted-foreground')}>{label}</dt>
      <div className="bg-muted/40 relative h-3.5 rounded-sm">
        <div
          className="absolute inset-y-0 rounded-sm"
          style={{ left: `${left}%`, width: `${width}%`, background: color }}
        />
      </div>
      <dd className={cn('text-right tabular-nums', strong && 'font-medium', netClass(to - from))}>
        {goldSigned(to - from)}
      </dd>
    </>
  )
}
