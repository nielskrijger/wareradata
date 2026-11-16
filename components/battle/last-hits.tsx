import type { BattleHit } from '@/lib/rows'

import { SideDot } from '@/components/battle/side-dot'
import { EntityCell } from '@/components/cells/entity-cell'
import { ItemIcon } from '@/components/item-icon'
import { RelativeTime } from '@/components/relative-time'
import { Badge } from '@/components/ui/badge'
import { formatNumber } from '@/lib/format'

export function LastHits({ hits }: { hits: BattleHit[] }) {
  return (
    <ul className="divide-y text-sm">
      {hits.map(h => (
        <li key={h.id} className="flex items-center gap-3 py-1.5 tabular-nums">
          <SideDot side={h.side} />
          <div className="min-w-0 flex-1"><EntityCell entity={h.user} /></div>
          {h.weaponCode && <ItemIcon code={h.weaponCode} small />}
          {h.isCritical && <Badge variant="ghost" className="text-fire">crit</Badge>}
          <span className={h.isMissed ? 'text-muted-foreground w-14 text-right' : 'w-14 text-right'}>
            {h.isMissed ? 'miss' : formatNumber(h.damage)}
          </span>
          <RelativeTime iso={h.hitAt} className="text-muted-foreground w-14 text-right text-xs" />
        </li>
      ))}
    </ul>
  )
}
