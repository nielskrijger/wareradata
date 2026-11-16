'use client'

import type { AdviseRow } from './rows'
import type { Fact } from '@/lib/advisor/types'
import { Info } from 'lucide-react'
import { Fragment } from 'react'

import { ItemIcon } from '@/components/item-icon'

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Gain } from './gain'

function Value({ fact, text }: { fact: Fact, text: string }) {
  return (
    <>
      {fact.icon && <ItemIcon code={fact.icon} small />}
      {fact.icon && ' '}
      {text}
    </>
  )
}

/**
 * The row's reason as one line of key numbers, with the breakdown and full
 * sentence behind an info button. A popover so a tap opens it too.
 */
export function Reason({ row }: { row: AdviseRow }) {
  const brief = row.facts.filter(f => f.brief)
  if (!brief.length) {
    return <span className="text-muted-foreground max-w-[70ch] text-xs">{row.why}</span>
  }

  return (
    <span className="text-muted-foreground flex flex-wrap items-center gap-x-1.5 text-xs">
      {brief.map((f, i) => (
        <Fragment key={f.label}>
          {i > 0 && <span aria-hidden>·</span>}
          <span className="whitespace-nowrap"><Value fact={f} text={f.brief!} /></span>
        </Fragment>
      ))}
      <Popover>
        <PopoverTrigger
          openOnHover
          delay={0}
          aria-label="Breakdown"
          className="hover:text-foreground focus-visible:text-foreground inline-flex rounded-full outline-none"
        >
          <Info aria-hidden className="size-3.5" />
        </PopoverTrigger>
        <PopoverContent side="bottom" align="start" className="flex w-80 flex-col gap-2.5 text-xs">
          <Gain value={row.gainPerDay} className="text-lg leading-none">
            <span className="text-muted-foreground ml-1 text-xs">g/day</span>
          </Gain>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
            {row.facts.map(f => (
              <Fragment key={f.label}>
                <dt className="text-muted-foreground">{f.label}</dt>
                <dd className="text-right"><Value fact={f} text={f.value} /></dd>
              </Fragment>
            ))}
          </dl>
          <p className="text-muted-foreground border-t pt-2.5">{row.why}</p>
        </PopoverContent>
      </Popover>
    </span>
  )
}
