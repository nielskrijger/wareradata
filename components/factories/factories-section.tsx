import type { FactoryLedgerRow } from '@/lib/factories/ledger'

import { getSnapshot } from '@/lib/cache/memory'
import { buildEngineModel } from '@/lib/factories/engine'
import { engineLevelOf, factoryInputFromData, recipeFromGameConfig } from '@/lib/factories/inputs'
import { buildFactoryLedgerRow } from '@/lib/factories/ledger'
import { buildFrontier, computeFactoryProfit, portfolioTotals } from '@/lib/factories/profit'
import { logger } from '@/lib/log'
import { getItemPrices, getUserCompanies } from '@/lib/warera/api'

import { FactoryOverview } from './factory-overview'

const log = logger.child({ component: 'factories' })

/**
 * Fetches and computes a user's factory ledger rows: daily profit from the
 * automated engine plus the NPC employees, the Top potential (the same output on
 * the most profitable item), and per-employee money and stats. Fetches
 * live on the urgent client (companies and their rosters; prices are cached and
 * shared across users). Net excludes self-work.
 *
 * Returns null when the user owns none, or when a live API call fails — the
 * section is best-effort enrichment, so a price/company outage just omits it
 * rather than failing the user page.
 */
async function loadFactoryRows(userId: string): Promise<FactoryLedgerRow[] | null> {
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
    const regionName = (id: string) => lookups.regionById.get(id)?.name ?? '—'
    const nameById = new Map(factories.flatMap(f => f.employees.map(e => [e._id, e.name] as const)))

    return factories
      .map((f) => {
        const profit = computeFactoryProfit(factoryInputFromData(f, regionName, model), prices, recipe, frontier)
        const productionPoints = recipe[f.company.itemCode]?.productionPoints ?? 1

        return buildFactoryLedgerRow(profit, f.employees, engineLevelOf(f), productionPoints, nameById)
      })
      .sort((a, b) => b.netPerDay - a.netPerDay)
  } catch (error) {
    log.error({ userId, err: error }, 'failed to load factories')

    return null
  }
}

export async function FactoriesSection({ userId }: { userId: string }) {
  const rows = await loadFactoryRows(userId)
  if (!rows) {
    return null
  }

  return <FactoryOverview rows={rows} totals={portfolioTotals(rows)} />
}
