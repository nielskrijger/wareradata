import { ArrowDown, ArrowUp, Minus } from 'lucide-react'

import { EmptyDash } from '@/components/empty-dash'
import { Badge } from '@/components/ui/badge'

interface Props {
  status: 'buff' | 'debuff' | 'neither' | null
}

/**
 * Combat-status pill from a user's attack buffs/debuffs: green "Buff" (net
 * attack bonus), red "Debuff" (net penalty), or a muted dash for "neither".
 * Renders an em-dash placeholder when the status is unknown.
 */
export function CombatStatusBadge({ status }: Props) {
  if (status == null) {
    return <EmptyDash />
  }
  if (status === 'neither') {
    return (
      <span className="text-muted-foreground inline-flex items-center gap-1 text-xs">
        <Minus className="size-3" />
        None
      </span>
    )
  }
  if (status === 'buff') {
    return (
      <Badge className="bg-green-500/15 text-green-800 gap-0.5 dark:text-green-300">
        <ArrowUp className="size-3" />
        Buff
      </Badge>
    )
  }
  return (
    <Badge className="bg-red-500/15 text-red-800 gap-0.5 dark:text-red-300">
      <ArrowDown className="size-3" />
      Debuff
    </Badge>
  )
}
