import type { RankMapGroup, RankMapRow } from '@/components/detail/rank-map'
import type { GroupPremiumStats } from '@/lib/rows'

import { CompactNumber } from '@/components/cells/compact-number'
import { POINTS_LEGEND } from '@/components/points-breakdown-legend'
import { WAR_COLOR } from '@/components/war-eco-colors'
import { formatDecimal } from '@/lib/format'

// Its own file because Fast Refresh needs component files to export only components.

/**
 * One hue per rank map group, the same on every detail page.
 */
export const GROUP_COLOR = {
  combat: WAR_COLOR,
  economy: POINTS_LEGEND.Wealth.color,
  society: 'var(--heat-blue)',
  premium: POINTS_LEGEND.Level.color,
}

/**
 * A row, compact for the big skewed stats (damage, gold) and plain for small counts.
 */
export function rankRow(label: string, value: number | null, rank: number | null, compact = false): RankMapRow {
  return { label, value, rank, display: compact ? <CompactNumber value={value} /> : undefined }
}

/**
 * A row for a one-decimal score (development).
 */
export function decimalRankRow(label: string, value: number | null, rank: number | null): RankMapRow {
  return { label, value, rank, display: formatDecimal(value) }
}

type WealthPart = 'companies' | 'items' | 'cash' | 'equipment' | 'weapons'

type WealthParts = Record<`${WealthPart}Wealth` | `${WealthPart}WealthRank`, number | null>

/**
 * The wealth breakdown in an Economy group (a player's or a group's).
 */
export function wealthPartRows(r: WealthParts): RankMapRow[] {
  return [
    rankRow('Companies', r.companiesWealth, r.companiesWealthRank, true),
    rankRow('Items', r.itemsWealth, r.itemsWealthRank, true),
    rankRow('Cash', r.cashWealth, r.cashWealthRank, true),
    rankRow('Equipment', r.equipmentWealth, r.equipmentWealthRank, true),
    rankRow('Weapons', r.weaponsWealth, r.weaponsWealthRank, true),
  ]
}

/**
 * A group's members' premium spending.
 */
export function premiumGroup(r: GroupPremiumStats): RankMapGroup {
  return {
    title: 'Premium',
    color: GROUP_COLOR.premium,
    rows: [
      rankRow('Gems bought', r.gemsPurchasedTotal, r.gemsPurchasedTotalRank, true),
      rankRow('Premium months', r.premiumMonthsTotal, r.premiumMonthsTotalRank),
      rankRow('Gifts', r.premiumGiftsTotal, r.premiumGiftsTotalRank),
    ],
  }
}
