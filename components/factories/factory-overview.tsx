'use client'

import type { FactoryLedgerRow } from '@/lib/factories/ledger'
import type { PortfolioTotals } from '@/lib/factories/profit'

import { Tabs, TabsList, TabsPanel, TabsTab } from '@/components/ui/tabs'

import { FactoryRoster } from './factory-roster'
import { FactoryValueMap } from './factory-value-map'

/**
 * The user-page factories section: the roster table by default, with the value
 * map as a second view of the same rows.
 */
export function FactoryOverview({ rows, totals }: { rows: FactoryLedgerRow[], totals: PortfolioTotals }) {
  return (
    <section className="bg-card overflow-hidden rounded-md border">
      <Tabs defaultValue="roster">
        <TabsList className="px-2">
          <TabsTab value="roster">Roster</TabsTab>
          <TabsTab value="value">Value map</TabsTab>
        </TabsList>
        <TabsPanel value="roster">
          <FactoryRoster rows={rows} totals={totals} />
        </TabsPanel>
        <TabsPanel value="value">
          <FactoryValueMap rows={rows} />
        </TabsPanel>
      </Tabs>
    </section>
  )
}
