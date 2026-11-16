'use client'

import type { CompanyRef, TitlePart } from '@/lib/advisor/types'

import { humanizeItem } from '@/components/factories/format'
import { ItemIcon } from '@/components/item-icon'

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

/**
 * A player-typed company name: coloured so even "6" reads as a name, cut short
 * when long, with the full name in a card. A popover so a tap opens it too.
 */
export function CompanyName({ company }: { company: CompanyRef }) {
  const workers = company.workers === 1 ? 'worker' : 'workers'

  // The icon sits outside the trigger so its own item card doesn't open on top.
  return (
    <span className="inline-flex max-w-full min-w-0 items-center gap-1 align-bottom">
      <Popover>
        <PopoverTrigger
          openOnHover
          delay={0}
          className="max-w-56 min-w-0 cursor-default truncate underline decoration-dotted decoration-1 underline-offset-4 outline-none"
          style={{ color: 'var(--fire)' }}
        >
          {company.name}
        </PopoverTrigger>
        <PopoverContent side="top" className="flex w-auto max-w-72 flex-col gap-1 text-xs">
          <span className="flex items-center gap-2 font-semibold">
            <ItemIcon code={company.itemCode} />
            {company.name}
          </span>
          <span className="text-muted-foreground">
            {`Makes ${humanizeItem(company.itemCode)} · ${company.workers} ${workers}`}
          </span>
        </PopoverContent>
      </Popover>
      <ItemIcon code={company.itemCode} small />
    </span>
  )
}

/**
 * A title with its companies styled and its items as icons.
 */
export function TitleParts({ parts }: { parts: TitlePart[] }) {
  return parts.map((p) => {
    if (typeof p === 'string') {
      return p
    }

    return 'item' in p
      ? <ItemIcon key={p.item} code={p.item} small />
      : <CompanyName key={p.id} company={p} />
  })
}
