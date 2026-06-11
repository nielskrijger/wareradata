import type { ColumnDef } from '@tanstack/react-table'

import type { ReadinessPill } from '@/lib/rows'

import type { RankingTier } from '@/lib/warera/api'

import { GearScorePill } from '@/components/badges/gear-score-pill'
import { ScaleBadge } from '@/components/badges/scale-badge'
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
 * Generic column factories for the patterns repeated verbatim across the entity
 * tables (countries / MUs / parties / battles / regions). Each returns a
 * `ColumnDef<T>` keyed off a row field, so a table lists `compactNumberColumn(...)`
 * instead of re-spelling the same cell + meta. Columns that genuinely diverge
 * (bespoke cells, raw-int / fixed-decimal formatting, per-row links) stay inline
 * in each table.
 *
 * Convention: the mandatory bits (the row key, the header) are positional; only
 * the optional knobs (heat mode, width, heat center) go in the trailing `opts`.
 */

type HeatMode = 'ramp' | 'median' | 'invert' | 'invertMedian'

// Top-level string keys of a row — what `accessorKey` and our `row.original[key]`
// reads accept.
type Key<T> = Extract<keyof T, string>

/**
 * Right-aligned `<CompactNumber>` cell (damage, wealth, bounty, money pools …).
 */
export function compactNumberColumn<T>(
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
export function dateColumn<T>(
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
 * Rows carrying the aggregate points fields, the shape every group table
 * (MUs, countries, parties, alliances) shares.
 */
interface PointsRow {
  totalPoints: number
  levelPoints: number
  damagePoints: number
  wealthPoints: number
  avgPoints: number | null
  avgPointsPerDay: number | null
}

/**
 * The aggregate points trio shared by the group tables: the member-summed
 * Total (with the level/damage/wealth breakdown on hover) plus the two
 * per-member averages. `who` names the collective in the tooltips. The /users
 * table keeps its own pair: its values are one player's points, not a sum.
 */
export function pointsColumns<T extends PointsRow>(who: 'members' | 'citizens'): ColumnDef<T>[] {
  const one = who.slice(0, -1)

  return [
    pointsBreakdownColumn<T>('totalPoints' as Key<T>, 'Total', { tooltip: `Combined points of all ${who}.` }),
    localeNumberColumn<T>('avgPoints' as Key<T>, 'Average', { heat: 'median', width: 110, tooltip: `Average points per ${one}.` }),
    localeNumberColumn<T>('avgPointsPerDay' as Key<T>, 'Avg / day', { heat: 'median', width: 125, tooltip: `Average points earned per day, per ${one}.` }),
  ]
}

/**
 * Rows carrying the five member-summed wealth components, the shape every
 * group table (MUs, countries, parties, alliances) shares.
 */
interface WealthComponentsRow {
  companiesWealth: number
  itemsWealth: number
  cashWealth: number
  equipmentWealth: number
  weaponsWealth: number
}

/**
 * The six aggregate wealth columns shared by the group tables: the
 * member-summed Total plus its five components. Only the Total's row key
 * (memberWealth vs citizenWealth) and the collective noun in the tooltips
 * differ per table. The /users table keeps its own set: its values are one
 * player's holdings, not a sum, so the tooltips read differently.
 */
export function wealthBreakdownColumns<T extends WealthComponentsRow>(
  totalKey: Key<T>,
  who: 'members' | 'citizens',
): ColumnDef<T>[] {
  return [
    compactNumberColumn<T>(totalKey, 'Total', { heat: 'median', width: 110, tooltip: `Combined wealth of all ${who} (companies + items + cash + equipment + weapons).` }),
    compactNumberColumn<T>('companiesWealth' as Key<T>, 'Companies', { heat: 'median', width: 135, tooltip: `Combined company value across ${who}.` }),
    compactNumberColumn<T>('itemsWealth' as Key<T>, 'Items', { heat: 'median', width: 100, tooltip: `Combined item value across ${who}.` }),
    compactNumberColumn<T>('cashWealth' as Key<T>, 'Cash', { heat: 'median', width: 100, tooltip: `Combined cash across ${who}.` }),
    compactNumberColumn<T>('equipmentWealth' as Key<T>, 'Equipment', { heat: 'median', width: 130, tooltip: `Combined equipment value across ${who}.` }),
    compactNumberColumn<T>('weaponsWealth' as Key<T>, 'Weapons', { heat: 'median', width: 125, tooltip: `Combined weapon value across ${who}.` }),
  ]
}

/**
 * Right-aligned locale-formatted integer (`12,345`), null-safe. Suits both the
 * nullable averages (avgPoints) and the always-present totals (gems, premium).
 */
export function localeNumberColumn<T>(
  key: Key<T>,
  header: string,
  opts: { heat?: HeatMode, center?: number, logScale?: boolean, width?: number, tooltip?: string } = {},
): ColumnDef<T> {
  return {
    accessorKey: key,
    header,
    cell: ({ row }) => (row.original[key] as number | null)?.toLocaleString() ?? null,
    sortDescFirst: true,
    meta: { heat: opts.heat, heatCenter: opts.center, heatLogScale: opts.logScale, align: 'right', width: opts.width ?? 100, tooltip: opts.tooltip },
  }
}

/**
 * A `<CompactNumber>` value whose companion rank shows on hover, sorted by the
 * rank field (ascending = best). Replaces the paired value/rank columns.
 */
export function rankTooltipColumn<T>(
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
export function percentBarColumn<T>(
  key: Key<T>,
  header: string,
  opts: { width?: number } = {},
): ColumnDef<T> {
  return {
    accessorKey: key,
    header,
    cell: ({ row }) => <PercentBar value={row.original[key] as number | null} />,
    sortDescFirst: true,
    sortUndefined: 'last',
    meta: { width: opts.width ?? 130 },
  }
}

/**
 * Rarity-tinted `<TierBadge>` for a {@link RankingTier} field. Header defaults
 * to "Tier".
 */
export function tierColumn<T>(
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
 * An entity's collective War / Eco lean as a two-tone bar, for the MU and
 * country tables (both carry `avgWarShare`). Sorts on the average war share —
 * the distribution, not point totals, which scale with level — highest war%
 * first; entities with no trained members sort last. The per-user table uses
 * {@link CombatModeCell} instead (richer per-player tooltip with raw points
 * and discipline rank).
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
 * breakdown every row carries.
 */
export function pointsBreakdownColumn<
  T extends { levelPoints: number, damagePoints: number, wealthPoints: number },
>(
  totalKey: Key<T>,
  header: string,
  opts: { width?: number, tooltip?: string } = {},
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
      />
    ),
    sortDescFirst: true,
    meta: { heat: 'median', align: 'right', width: opts.width ?? 120, tooltip: opts.tooltip },
  }
}

/**
 * Rarity-tinted 0-100 gear-score pill (a player's gear, or a member average).
 */
export function gearColumn<T>(
  key: Key<T>,
  header: string,
  opts: { width?: number } = {},
): ColumnDef<T> {
  return {
    accessorKey: key,
    header,
    cell: ({ row }) => <GearScorePill score={row.original[key] as number | null} />,
    sortDescFirst: true,
    sortUndefined: 'last',
    meta: { align: 'right', width: opts.width ?? 100 },
  }
}

/**
 * The "which country does this belong to" cell (flag + linked name). Sorts by
 * `countryName` by default; pass `sortKey` for tables that sort it by code.
 */
export function countryColumn<
  T extends { countryCode: string | null, countryName: string | null, countryId: string | null },
>(
  opts: { sortKey?: Key<T>, width?: number } = {},
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
    meta: { width: opts.width ?? 150 },
  }
}

/**
 * A bounded value on the diverging {@link ScaleBadge} ramp (e.g. party ethics).
 */
export function scaleBadgeColumn<T>(
  key: Key<T>,
  header: string,
  opts: { width?: number } = {},
): ColumnDef<T> {
  return {
    accessorKey: key,
    header,
    cell: ({ row }) => <ScaleBadge value={row.original[key] as number | null} />,
    sortDescFirst: true,
    meta: { align: 'right', width: opts.width ?? 110 },
  }
}

/**
 * A null-safe percentage cell (`12%`, or `1.5%` with `decimals`), for policy
 * rates (taxes, unrest, production bonus) where the stored value is the percent.
 */
export function percentColumn<T>(
  key: Key<T>,
  header: string,
  opts: { heat?: HeatMode, center?: number, decimals?: number, sortInvert?: boolean, width?: number } = {},
): ColumnDef<T> {
  return {
    accessorKey: key,
    header,
    cell: ({ row }) => {
      const value = row.original[key] as number | null
      if (value === null) {
        return null
      }
      return `${opts.decimals != null ? value.toFixed(opts.decimals) : value}%`
    },
    sortDescFirst: true,
    meta: { heat: opts.heat, heatCenter: opts.center, sortInvert: opts.sortInvert, align: 'right', width: opts.width ?? 110 },
  }
}
