import type { RankingTier } from '@/lib/warera/api'

import { Badge } from '@/components/ui/badge'

const tierColor: Record<RankingTier, string> = {
  bronze: 'bg-amber-700/20 text-amber-900 dark:text-amber-200',
  silver: 'bg-zinc-400/30 text-zinc-800 dark:text-zinc-200',
  gold: 'bg-yellow-400/30 text-yellow-900 dark:text-yellow-200',
  platinum: 'bg-sky-400/25 text-sky-900 dark:text-sky-200',
  diamond: 'bg-cyan-400/25 text-cyan-900 dark:text-cyan-200',
  master: 'bg-fuchsia-400/25 text-fuchsia-900 dark:text-fuchsia-200',
}

interface Props {
  tier: RankingTier | null | undefined
}

export function TierBadge({ tier }: Props) {
  if (!tier) {
    return <>—</>
  }
  return <Badge className={tierColor[tier]}>{tier}</Badge>
}
