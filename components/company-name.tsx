'use client'

import type { CompanyRef, TitlePart } from '@/lib/advisor/types'

import { humanizeItem } from '@/components/factories/format'
import { ItemIcon } from '@/components/item-icon'

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

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
 * A title with its companies styled and its items as icons.
 */
export function TitleParts({ parts }: { parts: TitlePart[] }) {
  return parts.map((p, i) => {
    if (typeof p === 'string') {
      return p
    }

    if ('item' in p) {
      return <ItemIcon key={p.item} code={p.item} small />
    }

    if ('from' in p) {
      return (
        <span key="change" className="whitespace-nowrap">
          <ItemIcon code={p.from} small />
          {' → '}
          <ItemIcon code={p.to} small />
        </span>
      )
    }

    // A company followed by its own item already shows that icon.
    const next = parts.slice(i + 1).find(n => typeof n !== 'string')
    const repeats = !!next && 'from' in next && next.from === p.itemCode

    return <CompanyName key={p.id} company={p} icon={!repeats} />
  })
}
