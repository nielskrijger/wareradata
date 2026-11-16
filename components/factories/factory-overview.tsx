'use client'

import type { FactoryLedgerRow } from '@/lib/factories/ledger'
import type { PortfolioTotals } from '@/lib/factories/profit'

import { FactoryRoster } from './factory-roster'
import { FactoryValueMap } from './factory-value-map'

/**
 * The user-page factories section: the roster card, then the value map cards
 * when there are employees to plot.
 */
export function FactoryOverview({ rows, totals }: { rows: FactoryLedgerRow[], totals: PortfolioTotals }) {
  const hasEmployees = rows.some(row => row.employees.length > 0)

  return (
    <>
      <section className="bg-card overflow-hidden rounded-md border">
        <FactoryRoster rows={rows} totals={totals} />
      </section>
      {hasEmployees && <FactoryValueMap rows={rows} />}
    </>
  )
}
