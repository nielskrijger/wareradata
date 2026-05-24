import type { RankingTier } from '@/lib/warera/api'

import { Badge } from '@/components/ui/badge'

const tierColor: Record<RankingTier, string> = {
  bronze: 'bg-amber-700/20 text-amber-900',
  silver: 'bg-zinc-400/30 text-zinc-800',
  gold: 'bg-yellow-400/30 text-yellow-900',
  platinum: 'bg-sky-400/25 text-sky-900',
  diamond: 'bg-cyan-400/25 text-cyan-900',
  master: 'bg-fuchsia-400/25 text-fuchsia-900',
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
