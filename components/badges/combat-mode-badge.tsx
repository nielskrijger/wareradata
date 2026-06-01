import type { CombatMode } from '@/lib/skills/classify'

import { Badge } from '@/components/ui/badge'

// Per-mode tint, following the house badge style (bg-*/15 + dark-aware text),
// matching TierBadge / ReadinessBadge. War reads red (combat), Eco green
// (growth), Hybrid amber (split), Untrained muted.
const MODE_META: Record<CombatMode, { label: string, className: string }> = {
  war: { label: 'War', className: 'bg-red-500/15 text-red-800 dark:text-red-300' },
  eco: { label: 'Eco', className: 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300' },
  hybrid: { label: 'Hybrid', className: 'bg-amber-500/15 text-amber-800 dark:text-amber-300' },
  untrained: { label: 'Untrained', className: 'bg-muted text-muted-foreground' },
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
