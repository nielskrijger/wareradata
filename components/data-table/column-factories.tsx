import type { RowData } from '@tanstack/react-table'

import type { ColumnDef, DataColumnMeta } from './features'

import type { PointsStat } from '@/components/cells/points-breakdown-cell'

import type { ReadinessPill } from '@/lib/rows'

import type { RankingTier } from '@/lib/warera/api'
import { GearScorePill } from '@/components/badges/gear-score-pill'
import { TierBadge } from '@/components/badges/tier-badge'
import { CombatModeShareCell } from '@/components/cells/combat-mode-share-cell'
import { CompactNumber } from '@/components/cells/compact-number'
import { CountryCell } from '@/components/cells/country-cell'
import { PercentBar } from '@/components/cells/percent-bar'
import { PointsBreakdownCell } from '@/components/cells/points-breakdown-cell'
import { ReadinessPillBar } from '@/components/cells/readiness-pill-bar'
import { ValueWithRankTooltip } from '@/components/cells/value-with-rank-tooltip'
import { readinessScore } from '@/lib/rows'

/**
 * Column factories for patterns repeated across the entity tables. Required
 * bits (key, header) are positional; optional knobs go in `opts`.
 */

type HeatMode = 'ramp' | 'median' | 'invert' | 'invertMedian'

/**
 * Top-level string keys of a row — what `accessorKey` and our `row.original[key]`
 * reads accept.
 */
type Key<T> = Extract<keyof T, string>

/**
 * Right-aligned `<CompactNumber>` cell (damage, wealth, bounty, money pools …).
 */
export function compactNumberColumn<T extends RowData>(
  key: Key<T>,
  header: string,
  opts: { heat?: HeatMode, width?: number, tooltip?: string } = {},
): ColumnDef<T> {
  return {
    accessorKey: key,
    header,
    cell: ({ row }) => <CompactNumber value={row.original[key] as number | null} />,
    sortDescFirst: true,
    meta: { heat: opts.heat, align: 'right', width: opts.width ?? 110, tooltip: opts.tooltip },
  }
}

/**
 * Date-only column for an ISO timestamp (`2026-06-10`), null-safe. The slice
 * keeps the stored UTC date instead of shifting it into the viewer's zone.
 * Shared by the "Joined" / "Founded" columns.
 */
export function dateColumn<T extends RowData>(
  key: Key<T>,
  header: string,
  opts: { width?: number } = {},
): ColumnDef<T> {
  return {
    accessorKey: key,
    header,
    cell: ({ row }) => (row.original[key] as string | null)?.slice(0, 10) ?? null,
    sortDescFirst: true,
    meta: { width: opts.width ?? 110 },
  }
}

/**
 * Right-aligned locale-formatted integer (`12,345`), null-safe. Suits both the
 * nullable averages (avgPoints) and the always-present totals (gems, premium).
 */
export function localeNumberColumn<T extends RowData>(
  key: Key<T>,
  header: string,
  opts: Pick<DataColumnMeta, 'heat' | 'heatCenter' | 'heatLogScale' | 'width' | 'tooltip' | 'hiddenByDefault'> = {},
): ColumnDef<T> {
  return {
    accessorKey: key,
    header,
    cell: ({ row }) => (row.original[key] as number | null)?.toLocaleString() ?? null,
    sortDescFirst: true,
    meta: { align: 'right', width: 100, ...opts },
  }
}

/**
 * A `<CompactNumber>` value whose companion rank shows on hover, sorted by the
 * rank field (ascending = best), so no separate rank column is needed.
 */
export function rankTooltipColumn<T extends RowData>(
  valueKey: Key<T>,
  rankKey: Key<T>,
  header: string,
  opts: { width?: number, tooltip?: string } = {},
): ColumnDef<T> {
  return {
    accessorKey: rankKey,
    header,
    cell: ({ row }) => (
      <ValueWithRankTooltip rank={row.original[rankKey] as number | null}>
        <CompactNumber value={row.original[valueKey] as number | null} />
      </ValueWithRankTooltip>
    ),
    sortDescFirst: false,
    sortUndefined: 'last',
    meta: { heat: 'invert', sortInvert: true, align: 'right', width: opts.width ?? 130, tooltip: opts.tooltip },
  }
}

/**
 * Inline 0-100 `<PercentBar>` (health, hunger).
 */
export function percentBarColumn<T extends RowData>(
  key: Key<T>,
  header: string,
  opts: { width?: number, tooltip?: string } = {},
): ColumnDef<T> {
  return {
    accessorKey: key,
    header,
    cell: ({ row }) => <PercentBar value={row.original[key] as number | null} />,
    sortDescFirst: true,
    sortUndefined: 'last',
    meta: { width: opts.width ?? 130, tooltip: opts.tooltip },
  }
}

/**
 * Rarity-tinted `<TierBadge>` for a {@link RankingTier} field. Header defaults
 * to "Tier".
 */
export function tierColumn<T extends RowData>(
  key: Key<T>,
  opts: { header?: string, width?: number } = {},
): ColumnDef<T> {
  return {
    accessorKey: key,
    header: opts.header ?? 'Tier',
    cell: ({ row }) => <TierBadge tier={row.original[key] as RankingTier | null} />,
    meta: { width: opts.width ?? 90 },
  }
}

/**
 * The readiness buff/ready/debuff pill bar. `accessorFn` enables the sortable
 * header; the actual ordering is done server-side (manualSorting) via the
 * matching `readinessScore` sort case.
 */
export function readinessColumn<T extends { readinessPill: ReadinessPill }>(
  opts: { width?: number } = {},
): ColumnDef<T> {
  return {
    id: 'readinessScore',
    header: 'Readiness',
    accessorFn: row => readinessScore(row.readinessPill),
    cell: ({ row }) => <ReadinessPillBar mix={row.original.readinessPill} />,
    sortDescFirst: true,
    sortUndefined: 'last',
    meta: { width: opts.width ?? 130 },
  }
}

/**
 * A group's war/eco lean. Sorts on the mean war share, since point totals scale
 * with level.
 */
export function combatModeColumn<T extends { avgWarShare: number | null }>(
  opts: { width?: number } = {},
): ColumnDef<T> {
  return {
    accessorKey: 'avgWarShare',
    header: 'Skills',
    cell: ({ row }) => <CombatModeShareCell avgWarShare={row.original.avgWarShare} />,
    sortDescFirst: true,
    sortUndefined: 'last',
    meta: { width: opts.width ?? 110 },
  }
}

/**
 * The headline points column: a {@link PointsBreakdownCell} reading the entity's
 * total (`totalKey`) plus the fixed `levelPoints`/`damagePoints`/`wealthPoints`
 * breakdown every row carries. `stats` adds rows (averages, rates) to the tooltip.
 */
export function pointsBreakdownColumn<
  T extends { levelPoints: number, damagePoints: number, wealthPoints: number },
>(
  totalKey: Key<T>,
  header: string,
  opts: { width?: number, tooltip?: string, stats?: (row: T) => PointsStat[] } = {},
): ColumnDef<T> {
  return {
    accessorKey: totalKey,
    header,
    cell: ({ row }) => (
      <PointsBreakdownCell
        total={row.original[totalKey] as number}
        level={row.original.levelPoints}
        damage={row.original.damagePoints}
        wealth={row.original.wealthPoints}
        stats={opts.stats?.(row.original)}
      />
    ),
    sortDescFirst: true,
    meta: { heat: 'median', align: 'right', width: opts.width ?? 120, tooltip: opts.tooltip },
  }
}

/**
 * Rarity-tinted 0-100 gear-score pill (a player's gear, or a member average).
 */
export function gearColumn<T extends RowData>(
  key: Key<T>,
  header: string,
  opts: { width?: number, tooltip?: string } = {},
): ColumnDef<T> {
  return {
    accessorKey: key,
    header,
    cell: ({ row }) => <GearScorePill score={row.original[key] as number | null} />,
    sortDescFirst: true,
    sortUndefined: 'last',
    meta: { align: 'right', width: opts.width ?? 100, tooltip: opts.tooltip },
  }
}

/**
 * The "which country does this belong to" cell (flag + linked name). Sorts by
 * `countryName` by default; pass `sortKey` for tables that sort it by code.
 */
export function countryColumn<
  T extends { countryCode: string | null, countryName: string | null, countryId: string | null },
>(
  opts: { sortKey?: Key<T>, width?: number, hiddenByDefault?: boolean } = {},
): ColumnDef<T> {
  const accessorKey: Key<T> = opts.sortKey ?? ('countryName' as Key<T>)

  return {
    accessorKey,
    header: 'Country',
    cell: ({ row }) => (
      <CountryCell
        countryCode={row.original.countryCode}
        countryName={row.original.countryName}
        countryId={row.original.countryId}
      />
    ),
    // Tight enough that most names fit; long ones (e.g. "Bosnia and
    // Herzegovina") truncate to an ellipsis with the full name on hover.
    meta: { width: opts.width ?? 150, hiddenByDefault: opts.hiddenByDefault },
  }
}

/**
 * A null-safe percentage cell (`12%`, or `1.5%` with `decimals`), for policy
 * rates (taxes, unrest) where the stored value is the percent.
 */
export function percentColumn<T extends RowData>(
  key: Key<T>,
  header: string,
  opts: {
    heat?: HeatMode
    center?: number
    decimals?: number
    sortInvert?: boolean
    width?: number
    tooltip?: string
    rankKey?: Key<T>
  } = {},
): ColumnDef<T> {
  return {
    accessorKey: key,
    header,
    cell: ({ row }) => {
      const value = row.original[key] as number | null
      if (value === null) {
        return null
      }

      const display = `${opts.decimals != null ? value.toFixed(opts.decimals) : value}%`
      if (!opts.rankKey) {
        return display
      }

      return (
        <ValueWithRankTooltip rank={row.original[opts.rankKey] as number | null}>
          {display}
        </ValueWithRankTooltip>
      )
    },
    sortDescFirst: true,
    meta: {
      heat: opts.heat,
      heatCenter: opts.center,
      sortInvert: opts.sortInvert,
      align: 'right',
      width: opts.width ?? 110,
      tooltip: opts.tooltip,
    },
  }
}
