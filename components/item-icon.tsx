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

/**
 * What a page knows about items, for the icon tooltips.
 */
export interface ItemCatalog {
  prices: ItemPrices
  recipe: RecipeLookup
}

const ItemCatalogContext = createContext<ItemCatalog | null>(null)

export function ItemCatalogProvider({ catalog, children }: { catalog: ItemCatalog, children: ReactNode }) {
  return <ItemCatalogContext value={catalog}>{children}</ItemCatalogContext>
}

function ItemImage({ code, className, title }: { code: string, className: string, title?: string }) {
  return (
    <Image
      src={itemIconUrl(code)}
      alt={humanizeItem(code)}
      title={title}
      width={40}
      height={40}
      className={cn('inline-block shrink-0 object-contain', className)}
      unoptimized
    />
  )
}

/**
 * The game's item card: name, market value and recipe, each only when known.
 */
function ItemTooltipContent({ code, catalog }: { code: string, catalog: ItemCatalog }) {
  const price = catalog.prices[code]
  const recipe = catalog.recipe[code]

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
                <ItemImage code={input} title={humanizeCode(input)} className="size-4" />
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
 * An item's icon. Inside an {@link ItemCatalogProvider} it opens the item card
 * on hover; elsewhere it shows only the name.
 */
export function ItemIcon({ code, small }: { code: string, small?: boolean }) {
  const catalog = use(ItemCatalogContext)
  const size = small ? 'size-4' : 'size-5'
  const align = small && 'align-[-0.2em]'
  if (!catalog) {
    return <ItemImage code={code} title={humanizeItem(code)} className={cn(size, align)} />
  }

  return (
    <Tooltip>
      <TooltipTrigger render={<span className={cn('inline-flex cursor-default', align)} />}>
        <ItemImage code={code} className={size} />
      </TooltipTrigger>
      <TooltipContent side="top">
        <ItemTooltipContent code={code} catalog={catalog} />
      </TooltipContent>
    </Tooltip>
  )
}
