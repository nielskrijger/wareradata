import type { AdviseRow } from './rows'
import { ArrowRight } from 'lucide-react'

import { CompanyName } from './company-name'
import { ItemIcon } from './item-icon'

/**
 * "Switch 6 [lead] → [oil]": the icons name the items, so the company keeps its own name.
 */
export function SwitchTitle({ change }: { change: NonNullable<AdviseRow['switch']> }) {
  return (
    <span className="inline-flex max-w-full flex-wrap items-center gap-1.5">
      Switch
      <CompanyName company={change.company} icon={false} />
      <span className="inline-flex items-center gap-1">
        <ItemIcon code={change.from} />
        <ArrowRight aria-label="to" className="text-muted-foreground size-3.5" />
        <ItemIcon code={change.to} />
      </span>
    </span>
  )
}
