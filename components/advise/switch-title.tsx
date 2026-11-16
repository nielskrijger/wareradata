import type { AdviseRow } from './rows'
import { ArrowRight } from 'lucide-react'
import Image from 'next/image'

import { humanizeItem } from '@/components/factories/format'
import { cn } from '@/lib/utils'
import { itemIconUrl } from '@/lib/warera/urls'

export function ItemIcon({ code, small }: { code: string, small?: boolean }) {
  return (
    <Image
      src={itemIconUrl(code)}
      alt={humanizeItem(code)}
      title={humanizeItem(code)}
      width={20}
      height={20}
      className={cn('inline-block shrink-0 object-contain', small ? 'size-4 align-[-0.2em]' : 'size-5')}
      unoptimized
    />
  )
}

/**
 * "Switch 6 [lead] → [oil]": the icons name the items, so the company keeps its own name.
 */
export function SwitchTitle({ change }: { change: NonNullable<AdviseRow['switch']> }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      {`Switch ${change.company}`}
      <span className="inline-flex items-center gap-1">
        <ItemIcon code={change.from} />
        <ArrowRight aria-label="to" className="text-muted-foreground size-3.5" />
        <ItemIcon code={change.to} />
      </span>
    </span>
  )
}
