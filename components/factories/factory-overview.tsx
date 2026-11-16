'use client'

import type { FactoryLedgerRow } from '@/lib/factories/ledger'
import type { PortfolioTotals } from '@/lib/factories/profit'

import { FactoryRoster } from './factory-roster'

/**
 * The user-page factories section.
 */
export function FactoryOverview({ rows, totals }: { rows: FactoryLedgerRow[], totals: PortfolioTotals }) {
  return (
    <section className="bg-card overflow-hidden rounded-md border">
      <FactoryRoster rows={rows} totals={totals} />
    </section>
  )
}
