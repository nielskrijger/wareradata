import type { ReactNode } from 'react'

import type { FactoryLedgerRow } from '@/lib/factories/ledger'
import type { PortfolioTotals } from '@/lib/factories/profit'

import { StackedBar } from '@/components/stacked-bar'
import { cn } from '@/lib/utils'

import { ENGINE_FILL, goldSigned, netClass } from './format'

const STAFF_FILL = 'var(--heat-green)'

interface Props {
  rows: FactoryLedgerRow[]
  totals: PortfolioTotals
}

/**
 * A user's daily factory net as one bar: engines plus staff (employee output
 * after wages and managers), filling up to Top potential. Self-work is excluded.
 */
export function FactoryIncome({ rows, totals }: Props) {
  const net = totals.netPerDay
  const engines = rows.reduce((s, r) => s + r.engineNetPerDay, 0)
  const staff = net - engines
  const hasStaff = rows.some(r => r.employees.length > 0)
  const potential = totals.bestPotentialNetPerDay
  const missed = potential - net

  // Stacking only adds up when neither part is a loss; otherwise show net alone.
  const segments = engines >= 0 && staff >= 0
    ? [{ key: 'engines', value: engines, color: ENGINE_FILL }, { key: 'staff', value: staff, color: STAFF_FILL }]
    : [{ key: 'net', value: net, color: STAFF_FILL }]

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 text-sm tabular-nums">
        <span>
          <span className={cn('font-medium', netClass(net))}>{goldSigned(net)}</span>
          <span className="text-muted-foreground"> / day</span>
        </span>
        {potential > 0 && (
          <span className="text-muted-foreground text-xs">{`of ${goldSigned(potential)} possible`}</span>
        )}
      </div>
      <StackedBar className="bg-muted h-2.5" total={Math.max(potential, net, 0)} segments={segments} />
      <div className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-xs tabular-nums">
        <Legend color={ENGINE_FILL}>{`Engines ${goldSigned(engines)}`}</Legend>
        {hasStaff && <Legend color={STAFF_FILL}>{`Staff ${goldSigned(staff)}`}</Legend>}
        {potential > 0 && missed >= 0.05 && (
          <Legend color="var(--muted)" outlined>{`Missed ${goldSigned(missed).replace('+', '')}`}</Legend>
        )}
      </div>
    </div>
  )
}

/**
 * `outlined` keeps the empty-track swatch visible against the card.
 */
function Legend({ color, outlined, children }: { color: string, outlined?: boolean, children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={cn('size-2 rounded-full', outlined && 'ring-muted-foreground/40 ring-1')}
        style={{ background: color }}
      />
      {children}
    </span>
  )
}
