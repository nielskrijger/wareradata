import type { ReactNode } from 'react'

import { ItemCatalogProvider } from '@/components/item-icon'
import { getSnapshot } from '@/lib/cache/memory'
import { recipeFromGameConfig } from '@/lib/factories/inputs'
import { getItemPrices } from '@/lib/warera/api'

/**
 * Gives the item icons below it prices and recipes for their tooltips. Both
 * sources are memoized, so pages that already loaded them pay nothing extra.
 */
export async function ItemCatalog({ children }: { children: ReactNode }) {
  const [{ gameConfig }, prices] = await Promise.all([getSnapshot(), getItemPrices()])

  return (
    <ItemCatalogProvider catalog={{ prices, recipe: recipeFromGameConfig(gameConfig) }}>
      {children}
    </ItemCatalogProvider>
  )
}
