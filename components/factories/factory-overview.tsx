'use client'

import type { FactoryLedgerRow } from '@/lib/factories/ledger'
import type { PortfolioTotals } from '@/lib/factories/profit'

import { useState } from 'react'

import { FactoryIncome } from './factory-income'
import { FactoryRoster } from './factory-roster'
import { FactoryValueMap } from './factory-value-map'

/**
 * The user-page factories section: the daily income waterfall and the roster
 * in one card, then the value map cards when there are employees to plot.
 */
export function FactoryOverview({ rows, totals }: { rows: FactoryLedgerRow[], totals: PortfolioTotals }) {
  // The top earner starts open, so the roster shows what's inside each row.
  const [open, setOpen] = useState(() => new Set(rows.slice(0, 1).map(r => r.id)))
  const employeeCount = rows.reduce((n, r) => n + r.employees.length, 0)
  const allOpen = open.size === rows.length

  function toggle(id: string) {
    setOpen((prev) => {
      const next = new Set(prev)
      if (!next.delete(id)) {
        next.add(id)
      }

      return next
    })
  }

  return (
    <>
      <section className="bg-card overflow-hidden rounded-md border">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-4 pt-4 sm:px-5">
          <h2 className="font-medium">Factories</h2>
          <span className="text-muted-foreground text-xs tabular-nums">
            {totals.activeCount < totals.count
              ? `${totals.activeCount}/${totals.count} active`
              : plural(totals.count, 'factory', 'factories')}
            {' · '}
            {plural(employeeCount, 'employee', 'employees')}
          </span>
        </div>
        <div className="max-w-2xl px-4 pt-3 pb-4 sm:px-5">
          <FactoryIncome rows={rows} totals={totals} />
        </div>
        <div className="flex justify-end border-t px-4 py-2 sm:px-5">
          <button
            type="button"
            onClick={() => setOpen(allOpen ? new Set() : new Set(rows.map(r => r.id)))}
            className="text-muted-foreground hover:text-foreground text-xs"
          >
            {allOpen ? 'Collapse all' : 'Expand all'}
          </button>
        </div>
        <FactoryRoster rows={rows} totals={totals} open={open} onToggle={toggle} />
      </section>
      {employeeCount > 0 && <FactoryValueMap rows={rows} />}
    </>
  )
}

function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`
}
