'use client'

import type { ReactNode } from 'react'
import type { ItemPrices, RecipeLookup } from '@/lib/factories/profit'
import Image from 'next/image'
import { createContext, Fragment, use } from 'react'

import { TooltipRow, TooltipSection } from '@/components/cells/tooltip-ledger'
import { humanizeCode, humanizeItem } from '@/components/factories/format'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { formatNumber } from '@/lib/format'
import { cn } from '@/lib/utils'
import { itemIconUrl } from '@/lib/warera/urls'

interface Catalog {
  prices: ItemPrices
  recipe: RecipeLookup
}

const ItemCatalogContext = createContext<Catalog | null>(null)

/**
 * Prices and recipes for the item cards; use `<ItemCatalog>` from a server page.
 */
export function ItemCatalogProvider({ catalog, children }: { catalog: Catalog, children: ReactNode }) {
  return <ItemCatalogContext value={catalog}>{children}</ItemCatalogContext>
}

function ItemImage({ code, className }: { code: string, className: string }) {
  return (
    <Image
      src={itemIconUrl(code)}
      alt={humanizeItem(code)}
      width={40}
      height={40}
      className={cn('inline-block shrink-0 object-contain', className)}
      unoptimized
    />
  )
}

/**
 * The game's item card: name, then market value and recipe when known.
 */
function ItemCard({ code }: { code: string }) {
  const catalog = use(ItemCatalogContext)
  const price = catalog?.prices[code]
  const recipe = catalog?.recipe[code]

  return (
    <div className="w-56 space-y-2.5">
      <div className="flex items-center gap-3">
        <ItemImage code={code} className="size-10" />
        <span className="text-sm font-medium">{humanizeCode(code)}</span>
      </div>
      {price != null && <TooltipRow label="Current value">{`${formatNumber(price)} g`}</TooltipRow>}
      {recipe && (
        <TooltipSection title="Needed to produce">
          <div className="flex flex-wrap items-center gap-1.5 tabular-nums">
            {`${formatNumber(recipe.productionPoints)} pt`}
            {Object.entries(recipe.productionNeeds).map(([input, qty]) => (
              <Fragment key={input}>
                <span className="text-neutral-500">+</span>
                {formatNumber(qty)}
                <ItemImage code={input} className="size-4" />
              </Fragment>
            ))}
            <span className="text-neutral-500">=</span>
            1
            <ItemImage code={code} className="size-4" />
          </div>
        </TooltipSection>
      )}
    </div>
  )
}

/**
 * An item's icon, opening its card on hover.
 */
export function ItemIcon({ code, small }: { code: string, small?: boolean }) {
  return (
    <Tooltip>
      <TooltipTrigger render={<span className={cn('inline-flex cursor-default', small && 'align-[-0.2em]')} />}>
        <ItemImage code={code} className={small ? 'size-4' : 'size-5'} />
      </TooltipTrigger>
      <TooltipContent side="top">
        <ItemCard code={code} />
      </TooltipContent>
    </Tooltip>
  )
}
