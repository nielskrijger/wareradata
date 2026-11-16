import { Coins, Swords, TrendingUp } from 'lucide-react'

/**
 * Hue and icon per point source, shared by the detail panel and the table
 * tooltip so they can't drift apart.
 */
export const POINTS_LEGEND = {
  Level: { color: 'var(--heat-purple)', icon: TrendingUp },
  Damage: { color: 'var(--heat-red)', icon: Swords },
  Wealth: { color: 'var(--heat-gold)', icon: Coins },
} as const

export type PointsCategory = keyof typeof POINTS_LEGEND
