import type { RankingTier } from '@/lib/warera/api'

import { BADGE } from '@/components/badges/tone'
import { EmptyDash } from '@/components/empty-dash'
import { Badge } from '@/components/ui/badge'

const tierColor: Record<RankingTier, string> = {
  bronze: BADGE.orange,
  silver: BADGE.grey,
  gold: BADGE.gold,
  platinum: BADGE.teal,
  diamond: BADGE.blue,
  master: BADGE.purple,
}

interface Props {
  tier: RankingTier | null | undefined
}

export function TierBadge({ tier }: Props) {
  if (!tier) {
    return <EmptyDash />
  }

  return <Badge className={tierColor[tier]}>{tier}</Badge>
}
