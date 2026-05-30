import { ArrowDown, ArrowUp } from 'lucide-react'

import { EmptyDash } from '@/components/empty-dash'
import { Badge } from '@/components/ui/badge'

interface Props {
  status: 'buff' | 'debuff' | 'neither' | null
}

/**
 * Readiness pill from a user's attack buffs/debuffs: green "Buff" (net attack
 * bonus), red "Debuff" (net penalty), or a muted "Ready" when neither is active
 * (baseline, free to take a buff). Renders an em-dash when unknown.
 */
export function ReadinessBadge({ status }: Props) {
  if (status == null) {
    return <EmptyDash />
  }
  if (status === 'neither') {
    return (
      <Badge className="bg-sky-500/15 text-sky-800 dark:text-sky-300">
        Ready
      </Badge>
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
