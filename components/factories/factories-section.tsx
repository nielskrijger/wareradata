import type { FactoryProfit } from '@/lib/factories/profit'

import { getSnapshot } from '@/lib/cache/memory'
import { buildItemBonus, factoryInputFromData, recipeFromGameConfig } from '@/lib/factories/inputs'
import { buildFrontier, computeFactoryProfit, portfolioTotals } from '@/lib/factories/profit'
import { getItemBestRegions, getItemPrices, getUserCompanies } from '@/lib/warera/api'

import { FactoriesTable } from './factories-table'

/**
 * Streams a user's factories with daily profit and the Move / Top relocation
 * potentials. Fetches live on the urgent client (companies in two requests;
 * prices and the per-item best-region frontier are cached and shared across
 * users). Renders nothing for a user with no factories.
 */
/**
 * Fetches and computes a user's factory rows. Returns null when the user owns
 * none, or when a live API call fails — the section is best-effort enrichment,
 * so a price/company outage just omits it rather than failing the user page.
 */
async function loadFactoryRows(userId: string): Promise<FactoryProfit[] | null> {
  try {
    const factories = await getUserCompanies(userId)
    if (!factories.length) {
      return null
    }

    const { gameConfig, lookups } = await getSnapshot()
    const recipe = recipeFromGameConfig(gameConfig)

    const [prices, bestRegions] = await Promise.all([
      getItemPrices(),
      getItemBestRegions(Object.keys(recipe)),
    ])

    const regionName = (id: string) => lookups.regionById.get(id)?.name ?? '—'
    const itemBonus = buildItemBonus(bestRegions, regionName)
    const frontier = buildFrontier(prices, recipe, itemBonus)

    return factories
      .map(f => computeFactoryProfit(factoryInputFromData(f, regionName), prices, recipe, itemBonus, frontier))
      .sort((a, b) => b.netPerDay - a.netPerDay)
  } catch (error) {
    console.error('[factories] failed to load for user', userId, error)
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
