import type { CombatMode } from '@/lib/skills/classify'

import { BADGE } from '@/components/badges/tone'
import { Badge } from '@/components/ui/badge'

/**
 * Per-mode tint, following the house badge style (a 15% tinted background + dark-aware text),
 * matching TierBadge / BuffBadge. War reads red (combat), Eco green
 * (growth), Hybrid gold (split), Untrained muted.
 */
const MODE_META: Record<CombatMode, { label: string, className: string }> = {
  war: { label: 'War', className: BADGE.red },
  eco: { label: 'Eco', className: BADGE.green },
  hybrid: { label: 'Hybrid', className: BADGE.gold },
  untrained: { label: 'Untrained', className: BADGE.muted },
}

interface Props {
  mode: CombatMode
}

/**
 * Badge showing a player's War / Eco / Hybrid skill specialization (or
 * Untrained when they've invested nothing in either discipline). Color-coded so
 * the leaderboard reads at a glance.
 */
export function CombatModeBadge({ mode }: Props) {
  const meta = MODE_META[mode]

  return <Badge className={meta.className}>{meta.label}</Badge>
}
