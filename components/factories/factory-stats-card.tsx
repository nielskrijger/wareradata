import type { ReactNode } from 'react'
import type { FactoryLedgerRow } from '@/lib/factories/ledger'
import type { PortfolioTotals } from '@/lib/factories/profit'

import { cn } from '@/lib/utils'

import { goldSigned, netClass } from './format'

interface Props {
  className?: string
  rows: FactoryLedgerRow[]
  totals: PortfolioTotals
}

function Line({ label, value, strong }: { label: ReactNode, value: number, strong?: boolean }) {
  return (
    <div
      className={cn('flex items-baseline justify-between gap-2 text-sm', strong && 'mt-0.5 border-t pt-1 font-medium')}
    >
      <dt className={cn(!strong && 'text-muted-foreground')}>{label}</dt>
      <dd className={cn('tabular-nums', netClass(value))}>{goldSigned(value)}</dd>
    </div>
  )
}

/**
 * A user's factories as a short daily P&L, summing the same way as the roster
 * below it: engines + employee output − wages − managers = net. Underneath, net
 * as a share of Top potential. Self-work is excluded.
 */
export function FactoryStatsCard({ className, rows, totals }: Props) {
  const employees = rows.flatMap(r => r.employees)
  const engines = rows.reduce((s, r) => s + r.engineNetPerDay, 0)
  const output = employees.reduce((s, e) => s + e.revenuePerDay - e.inputCostPerDay, 0)
  const wages = rows.reduce((s, r) => s + r.wagePerDay, 0)
  const managers = rows.reduce((s, r) => s + r.managerPerDay, 0)
  const potential = totals.bestPotentialNetPerDay
  const pct = potential > 0 ? Math.max(0, Math.min(100, (totals.netPerDay / potential) * 100)) : null

  const counts = [
    totals.activeCount < totals.count
      ? `${totals.activeCount}/${totals.count} active`
      : `${totals.count} ${totals.count === 1 ? 'factory' : 'factories'}`,
    `${employees.length} ${employees.length === 1 ? 'employee' : 'employees'}`,
  ].join(' · ')

  return (
    <div className={cn('bg-card flex flex-col gap-3 rounded-md border p-3', className)}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium">Factories</span>
        <span className="text-muted-foreground text-xs tabular-nums">{counts}</span>
      </div>

      <dl className="space-y-0.5">
        <Line label="Engines" value={engines} />
        {employees.length > 0 && (
          <>
            <Line label="Employee output" value={output} />
            <Line label="Wages" value={-wages} />
          </>
        )}
        {managers >= 0.05 && <Line label="Managers" value={-managers} />}
        <Line label="Net / day" value={totals.netPerDay} strong />
      </dl>

      {pct != null && (
        <div className="space-y-1">
          <div className="text-muted-foreground flex justify-between gap-2 text-xs tabular-nums">
            <span>vs Top potential {goldSigned(potential)}</span>
            <span>{Math.round(pct)}%</span>
          </div>
          <div className="bg-muted h-1.5 overflow-hidden rounded-full">
            <div className="h-full rounded-full bg-green-600 dark:bg-green-400" style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Holds the card's place in the stat grid while the live roster loads.
 */
export function FactoryStatsCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('bg-card flex flex-col gap-3 rounded-md border p-3', className)}>
      <span className="text-sm font-medium">Factories</span>
      <span className="text-muted-foreground text-sm">Loading…</span>
    </div>
  )
}
