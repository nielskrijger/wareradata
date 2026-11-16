'use client'

import type { CompanyRef } from '@/lib/advisor/types'

import { humanizeItem } from '@/components/factories/format'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

import { ItemIcon } from './item-icon'

/**
 * A player-typed company name: coloured so even "6" reads as a name, cut short
 * when long, with the full name in a card. A popover so a tap opens it too.
 */
export function CompanyName({ company, icon = true }: { company: CompanyRef, icon?: boolean }) {
  const workers = company.workers === 1 ? 'worker' : 'workers'

  return (
    <Popover>
      <PopoverTrigger
        openOnHover
        delay={0}
        className="inline-flex max-w-full min-w-0 cursor-default items-center gap-1 align-bottom outline-none"
      >
        {icon && <ItemIcon code={company.itemCode} small />}
        <span
          className="max-w-56 truncate underline decoration-dotted decoration-1 underline-offset-4"
          style={{ color: 'var(--fire)' }}
        >
          {company.name}
        </span>
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
  )
}

/**
 * A title with its company names styled.
 */
export function TitleParts({ parts }: { parts: (string | CompanyRef)[] }) {
  return parts.map(p => typeof p === 'string' ? p : <CompanyName key={p.id} company={p} />)
}
