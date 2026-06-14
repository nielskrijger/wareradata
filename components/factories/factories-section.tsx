import type { FactoryLedgerRow } from '@/lib/factories/ledger'

import { getSnapshot } from '@/lib/cache/memory'
import { buildItemBonus, factoryInputFromData, recipeFromGameConfig } from '@/lib/factories/inputs'
import { buildFactoryLedgerRow } from '@/lib/factories/ledger'
import { buildFrontier, computeFactoryProfit, portfolioTotals } from '@/lib/factories/profit'
import { logger } from '@/lib/log'
import { getItemBestRegions, getItemPrices, getUserCompanies, getUserWorkers } from '@/lib/warera/api'

import { FactoriesTable } from './factories-table'

const log = logger.child({ component: 'factories' })

/**
 * Fetches and computes a user's factory ledger rows: daily profit, the Move / Top
 * relocation potentials, the net projected at full worker loyalty, and a
 * per-worker revenue/wage breakdown. Fetches live on the urgent client (companies
 * and their workers; prices and the per-item best-region frontier are cached and
 * shared across users). Net excludes self-work — see {@link effectiveProductionPoints}.
 *
 * Returns null when the user owns none, or when a live API call fails — the
 * section is best-effort enrichment, so a price/company outage just omits it
 * rather than failing the user page.
 */
async function loadFactoryRows(userId: string): Promise<FactoryLedgerRow[] | null> {
  try {
    const [factories, companyWorkers] = await Promise.all([getUserCompanies(userId), getUserWorkers(userId)])
    if (!factories.length) {
      return null
    }

    const { gameConfig, lookups, users } = await getSnapshot()
    const recipe = recipeFromGameConfig(gameConfig)

    const [prices, bestRegions] = await Promise.all([
      getItemPrices(),
      getItemBestRegions(Object.keys(recipe)),
    ])

    const regionName = (id: string) => lookups.regionById.get(id)?.name ?? '—'
    const itemBonus = buildItemBonus(bestRegions, regionName)
    const frontier = buildFrontier(prices, recipe, itemBonus)
    const workersByCompany = new Map(companyWorkers.map(c => [c.companyId, c.workers]))
    const userById = new Map(users.map(u => [u.id, u]))
    const nameOf = (id: string) => userById.get(id)?.username ?? `${id.slice(0, 6)}…`
    const skillOf = (id: string) => {
      const u = userById.get(id)
      return u && u.productionSkill !== null && u.energySkill !== null
        ? { production: u.productionSkill, energy: u.energySkill }
        : null
    }

    return factories
      .map((f) => {
        const profit = computeFactoryProfit(factoryInputFromData(f, regionName), prices, recipe, itemBonus, frontier)
        const productionPoints = recipe[f.company.itemCode]?.productionPoints ?? 1
        return buildFactoryLedgerRow(profit, f.stats, workersByCompany.get(f.company._id) ?? [], f.company.activeUpgradeLevels?.automatedEngine ?? 0, productionPoints, nameOf, skillOf)
      })
      .sort((a, b) => b.projectedNetPerDay - a.projectedNetPerDay)
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

  return <FactoriesTable rows={rows} totals={portfolioTotals(rows)} />
}
