import { Coins, Swords, TrendingUp } from 'lucide-react'

/**
 * The three point contributions (level / damage / wealth), each a distinct hue
 * plus an icon so they read at a glance. All three reference shared `--heat-*`
 * tokens (theme-aware, brighter on dark surfaces), keeping them consistent with
 * the war/eco/readiness palette. Shared by the detail PointsBreakdownPanel and
 * the table PointsBreakdownCell tooltip so the two never drift apart.
 */
export const POINTS_LEGEND = {
  Level: { color: 'var(--heat-purple)', icon: TrendingUp },
  Damage: { color: 'var(--heat-red)', icon: Swords },
  Wealth: { color: 'var(--heat-gold)', icon: Coins },
} as const

export type PointsCategory = keyof typeof POINTS_LEGEND
