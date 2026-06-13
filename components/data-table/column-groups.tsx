import type { ColumnDef } from '@tanstack/react-table'

import type { CaseRarity } from '@/lib/warera/api'

import { MIN_LUCK_PULLS } from '@/lib/cases'
import { CASE_RARITIES } from '@/lib/warera/api'

import { compactNumberColumn, localeNumberColumn, percentColumn, pointsBreakdownColumn } from './column-factories'

/**
 * Whole-category column groups: each returns the `ColumnDef<T>[]` for one
 * {@link buildColumns} group (points / wealth / cases), assembled from the
 * single-column factories in `column-factories.tsx`. The aggregate group
 * tables (MUs / countries / parties / alliances) share the same shapes, so a
 * group lives here once instead of being re-spelled per table; the /users
 * table keeps its own per-player variants where the wording differs.
 */

// Top-level string keys of a row — what `accessorKey` and `row.original[key]`
// accept. Duplicated from column-factories (a one-line internal alias) rather
// than widening that file's API to export it.
type Key<T> = Extract<keyof T, string>

/**
 * Rows carrying the aggregate points fields, the shape every group table
 * shares.
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
 * The aggregate points trio: the member-summed Total (with the
 * level/damage/wealth breakdown on hover) plus the two per-member averages.
 * `who` names the collective in the tooltips. The /users table keeps its own
 * pair: its values are one player's points, not a sum.
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
 * group table shares.
 */
interface WealthComponentsRow {
  companiesWealth: number
  itemsWealth: number
  cashWealth: number
  equipmentWealth: number
  weaponsWealth: number
}

/**
 * The six aggregate wealth columns: the member-summed Total plus its five
 * components. Only the Total's row key (memberWealth vs citizenWealth) and the
 * collective noun in the tooltips differ per table. The /users table keeps its
 * own set: its values are one player's holdings, not a sum, so the tooltips
 * read differently.
 */
export function wealthColumns<T extends WealthComponentsRow>(
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
 * Rows carrying the member-summed factory aggregates, the shape every group
 * table shares.
 */
interface FactoryStatsRow {
  factoryPpPerDay: number
  factoryPpPerMember: number | null
  factoryNetPerDay: number
  factoryEfficiencyPct: number | null
}

/**
 * The Industry column group: combined factory profit and production per day
 * (total + per-member), and location efficiency (realized net vs the best-region
 * Move potential). `who` names the collective in the tooltips and the per-member
 * header. Shared by the country / MU / alliance tables; empty until the slow
 * factory scrape has run.
 */
export function industryColumns<T extends FactoryStatsRow>(who: 'members' | 'citizens'): ColumnDef<T>[] {
  const one = who.slice(0, -1)

  return [
    compactNumberColumn<T>('factoryNetPerDay' as Key<T>, 'Net / day', { heat: 'median', width: 115, tooltip: `Combined factory profit per day across ${who} (revenue − inputs − wages).` }),
    compactNumberColumn<T>('factoryPpPerDay' as Key<T>, 'PP / day', { heat: 'median', width: 110, tooltip: `Combined production points per day across ${who}.` }),
    compactNumberColumn<T>('factoryPpPerMember' as Key<T>, who === 'citizens' ? 'PP / citizen' : 'PP / member', { heat: 'median', width: 130, tooltip: `Production points per day per ${one}.` }),
    percentColumn<T>('factoryEfficiencyPct' as Key<T>, 'Efficiency', { heat: 'median', decimals: 0, width: 115, tooltip: `Realized net ÷ best-region (Move) potential. Higher = better located.` }),
  ]
}

/**
 * Rows carrying the member-summed premium-spend totals, the shape the group
 * tables share.
 */
interface PremiumRow {
  gemsPurchasedTotal: number
  premiumMonthsTotal: number
  premiumGiftsTotal: number
}

/**
 * The premium-spend group: gems bought, premium months, and premium gifts, each
 * a member-summed total. Identical across the country / MU / party tables
 * (alliances carry no premium aggregate). The /users table keeps its own
 * per-player premium columns.
 */
export function premiumColumns<T extends PremiumRow>(): ColumnDef<T>[] {
  return [
    localeNumberColumn<T>('gemsPurchasedTotal' as Key<T>, 'Gems Bought', { heat: 'ramp', width: 150 }),
    localeNumberColumn<T>('premiumMonthsTotal' as Key<T>, 'Premium Mo.', { heat: 'ramp', width: 145 }),
    localeNumberColumn<T>('premiumGiftsTotal' as Key<T>, 'Premium Gifts', { heat: 'ramp', width: 155 }),
  ]
}

/**
 * Rows carrying the case-pull stats, the shape the /users table and every
 * group table share.
 */
interface CasesRow {
  standardCasesOpened: number | null
  mythicCasesOpened: number | null
  casesCommon: number | null
  casesUncommon: number | null
  casesRare: number | null
  casesEpic: number | null
  casesLegendary: number | null
  casesMythic: number | null
  caseLuck: number | null
  caseLuckRank: number | null
}

// Header widths per rarity column; keys and order come from CASE_RARITIES.
const CASE_RARITY_WIDTHS: Record<CaseRarity, number> = {
  common: 110,
  uncommon: 125,
  rare: 95,
  epic: 95,
  legendary: 125,
  mythic: 105,
}

/**
 * The Cases column group: opens per case type, pull luck vs the official drop
 * rates, then a count per rarity (weakest to strongest, the {@link
 * CASE_RARITIES} order). Counts are log-scaled — opens span 1 to hundreds of
 * thousands.
 */
export function casesColumns<T extends CasesRow>(): ColumnDef<T>[] {
  return [
    localeNumberColumn<T>('standardCasesOpened' as Key<T>, 'Standard Cases', { heat: 'ramp', logScale: true, width: 155, tooltip: 'Standard cases opened.' }),
    localeNumberColumn<T>('mythicCasesOpened' as Key<T>, 'Mythic Cases', { heat: 'ramp', logScale: true, width: 140, tooltip: 'Premium mythic cases opened.' }),
    percentColumn<T>('caseLuck' as Key<T>, 'Luck', {
      heat: 'median',
      center: 100,
      decimals: 1,
      width: 95,
      rankKey: 'caseLuckRank' as Key<T>,
      tooltip: `100% = exactly the published odds, higher = lucky. Premium cases count against premium odds. Hidden under ${MIN_LUCK_PULLS} pulls.`,
    }),
    ...CASE_RARITIES.map(rarity =>
      localeNumberColumn<T>(`cases${rarity[0].toUpperCase()}${rarity.slice(1)}` as Key<T>, `${rarity[0].toUpperCase()}${rarity.slice(1)}`, { heat: 'ramp', logScale: true, width: CASE_RARITY_WIDTHS[rarity] }),
    ),
  ]
}
