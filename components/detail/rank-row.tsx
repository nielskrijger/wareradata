import type { RankMapGroup, RankMapRow } from '@/components/detail/rank-map'
import type { PlayerStat } from '@/lib/rank-scale'
import type { GroupPointsStats, GroupPremiumStats, PointSources } from '@/lib/rows'

import { CompactNumber } from '@/components/cells/compact-number'
import { CATEGORY_COLOR } from '@/components/data-table/column-categories'
import { POINTS_LEGEND } from '@/components/points-breakdown-legend'
import { formatDecimal, percentOf } from '@/lib/format'

// Its own file because Fast Refresh needs component files to export only components.

/**
 * One hue per rank map group, the table category's where there is one.
 */
export const GROUP_COLOR = {
  points: CATEGORY_COLOR.points,
  combat: CATEGORY_COLOR.combat,
  economy: CATEGORY_COLOR.wealth,
  society: 'var(--heat-blue)',
  premium: CATEGORY_COLOR.premium,
}

/**
 * A row, compact for the big skewed stats (damage, gold) and plain for small
 * counts. `stat` names the player stat members are placed by, if any.
 */
export function rankRow(
  label: string,
  value: number | null,
  rank: number | null,
  compact = false,
  stat?: PlayerStat,
): RankMapRow {
  return { label, value, rank, stat, display: compact ? <CompactNumber value={value} /> : undefined }
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
    rankRow('Companies', r.companiesWealth, r.companiesWealthRank, true, 'companiesWealth'),
    rankRow('Items', r.itemsWealth, r.itemsWealthRank, true, 'itemsWealth'),
    rankRow('Cash', r.cashWealth, r.cashWealthRank, true, 'cashWealth'),
    rankRow('Equipment', r.equipmentWealth, r.equipmentWealthRank, true, 'equipmentWealth'),
    rankRow('Weapons', r.weaponsWealth, r.weaponsWealthRank, true, 'weaponsWealth'),
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
      rankRow('Gems bought', r.gemsPurchasedTotal, r.gemsPurchasedTotalRank, true, 'gemsPurchased'),
      rankRow('Premium months', r.premiumMonthsTotal, r.premiumMonthsTotalRank, false, 'premiumMonths'),
      rankRow('Gifts', r.premiumGiftsTotal, r.premiumGiftsTotalRank, false, 'premiumGifts'),
    ],
  }
}

const POINT_SOURCES = [
  ['Damage', 'damagePoints'],
  ['Wealth', 'wealthPoints'],
  ['Level', 'levelPoints'],
] as const

/**
 * Points: the total, each source with its share of it, then a rate row
 * (a group's per-member average, a player's points per day).
 */
export function pointsGroupOf(total: RankMapRow, r: PointSources, rate: RankMapRow): RankMapGroup {
  const whole = total.value ?? 0

  return {
    title: 'Points',
    color: GROUP_COLOR.points,
    rows: [
      total,
      ...POINT_SOURCES.map(([label, key]): RankMapRow => ({
        label,
        icon: POINTS_LEGEND[label].icon,
        value: r[key],
        rank: r[`${key}Rank`],
        stat: key,
        display: (
          <>
            <CompactNumber value={r[key]} />
            <span className="text-muted-foreground ml-1.5 text-xs">{percentOf(r[key], whole)}%</span>
          </>
        ),
      })),
      rate,
    ],
  }
}

/**
 * A group's {@link pointsGroupOf}, closing on the per-member average (`perLabel`, e.g. "Per citizen").
 */
export function pointsGroup(r: GroupPointsStats, perLabel: string): RankMapGroup {
  return pointsGroupOf(
    rankRow('Total', r.totalPoints, r.totalPointsRank, false, 'points'),
    r,
    rankRow(perLabel, r.avgPoints, r.avgPointsRank, false, 'points'),
  )
}
