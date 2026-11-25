import { Coins, Swords, TrendingUp } from 'lucide-react'

import { CATEGORY_COLOR, COLOR } from '@/components/colors'

/**
 * Hue and icon per point source, shared by the rank chart and the table
 * tooltip so they can't drift apart.
 */
export const POINTS_LEGEND = {
  Level: { color: COLOR.purple, icon: TrendingUp },
  Damage: { color: CATEGORY_COLOR.combat, icon: Swords },
  Wealth: { color: CATEGORY_COLOR.wealth, icon: Coins },
} as const

export type PointsCategory = keyof typeof POINTS_LEGEND
