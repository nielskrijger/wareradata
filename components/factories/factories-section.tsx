import type { ItemCatalog } from '@/components/item-icon'
import type { FactoryLedgerRow } from '@/lib/factories/ledger'

import { Factory } from 'lucide-react'
import { cache } from 'react'

import { Kpi } from '@/components/detail/kpi'
import { ItemCatalogProvider } from '@/components/item-icon'
import { getSnapshot } from '@/lib/cache/memory'
import { buildEngineModel } from '@/lib/factories/engine'
import { engineLevelOf, factoryInputFromData, recipeFromGameConfig } from '@/lib/factories/inputs'
import { buildFactoryLedgerRow } from '@/lib/factories/ledger'
import { buildFrontier, computeFactoryProfit, portfolioTotals } from '@/lib/factories/profit'
import { EMPTY } from '@/lib/format'
import { logger } from '@/lib/log'
import { getItemPrices, getUserCompanies } from '@/lib/warera/api'

import { FactoryOverview } from './factory-overview'
import { goldSigned, netClass } from './format'

const log = logger.child({ component: 'factories' })

interface FactoryData {
  rows: FactoryLedgerRow[]
  catalog: ItemCatalog
}

/**
 * A user's factory ledger, fetched live on the urgent client, with the item
 * prices and recipes it was priced with.
 *
 * Returns null when they own none or a call fails: the section is optional, so
 * an API outage shouldn't fail the user page.
 *
 * Request-memoized so the KPI and the roster share one fetch.
 */
const loadFactoryRows = cache(async (userId: string): Promise<FactoryData | null> => {
  try {
    const factories = await getUserCompanies(userId)
    if (!factories.length) {
      return null
    }

    const { gameConfig, lookups } = await getSnapshot()
    const recipe = recipeFromGameConfig(gameConfig)
    const model = buildEngineModel(gameConfig)
    const prices = await getItemPrices()
    const frontier = buildFrontier(prices, recipe)
    const regionName = (id: string) => lookups.regionById.get(id)?.name ?? EMPTY
    const nameById = new Map(factories.flatMap(f => f.employees.map(e => [e._id, e.name] as const)))

    const rows = factories
      .map((f) => {
        const profit = computeFactoryProfit(factoryInputFromData(f, regionName, model), prices, recipe, frontier)
        const productionPoints = recipe[f.company.itemCode]?.productionPoints ?? 1

        return buildFactoryLedgerRow(profit, f.employees, engineLevelOf(f), productionPoints, nameById)
      })
      .sort((a, b) => b.netPerDay - a.netPerDay)

    return { rows, catalog: { prices, recipe } }
  } catch (error) {
    log.error({ userId, err: error }, 'failed to load factories')

    return null
  }
})

/**
 * The KPI strip's factory figure, live like the roster: the scraped
 * aggregates can lag behind it.
 */
export async function FactoryKpi({ userId }: { userId: string }) {
  const data = await loadFactoryRows(userId)
  if (!data) {
    return null
  }

  const net = portfolioTotals(data.rows).netPerDay

  return (
    <Kpi
      label="Factories"
      icon={<Factory />}
      value={<span className={netClass(net)}>{goldSigned(net)}</span>}
      sub={`per day · ${data.rows.length} ${data.rows.length === 1 ? 'factory' : 'factories'}`}
    />
  )
}

export async function FactoriesSection({ userId }: { userId: string }) {
  const data = await loadFactoryRows(userId)
  if (!data) {
    return null
  }

  return (
    <ItemCatalogProvider catalog={data.catalog}>
      <FactoryOverview rows={data.rows} totals={portfolioTotals(data.rows)} />
    </ItemCatalogProvider>
  )
}
