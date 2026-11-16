import type { ColumnDef } from './features'

import type { CaseRarity } from '@/lib/warera/api'

import { MIN_LUCK_PULLS } from '@/lib/cases'
import { CASE_RARITIES } from '@/lib/warera/api'

import { compactNumberColumn, localeNumberColumn, percentColumn, pointsBreakdownColumn } from './column-factories'

/**
 * Whole-category column groups shared by the group tables (MUs, countries,
 * parties, alliances). /users keeps its own, since its values are one player's.
 */

/**
 * Top-level string keys of a row — what `accessorKey` and `row.original[key]`
 * accept. Duplicated from column-factories (a one-line internal alias) rather
 * than widening that file's API to export it.
 */
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
 * Member-summed total points with the per-member averages in its tooltip. The
 * averages also have their own hidden columns, for sorting. `who` names the
 * collective in the tooltips.
 */
export function pointsColumns<T extends PointsRow>(who: 'members' | 'citizens'): ColumnDef<T>[] {
  const one = who.slice(0, -1)

  return [
    pointsBreakdownColumn<T>('totalPoints' as Key<T>, 'Points', {
      tooltip: `Combined points of all ${who}.`,
      stats: row => [
        { label: `Average per ${one}`, value: row.avgPoints },
        { label: `Avg / day per ${one}`, value: row.avgPointsPerDay },
      ],
    }),
    localeNumberColumn<T>('avgPoints' as Key<T>, 'Average', {
      heat: 'median',
      width: 110,
      tooltip: `Average points per ${one}.`,
      hiddenByDefault: true,
    }),
    localeNumberColumn<T>('avgPointsPerDay' as Key<T>, 'Avg / day', {
      heat: 'median',
      width: 125,
      tooltip: `Average points earned per day, per ${one}.`,
      hiddenByDefault: true,
    }),
  ]
}

/**
 * Rows carrying the five member-summed wealth components, the shape every
 * group table shares.
 */
interface WealthComponentsRow {
  companiesWealth: number
  stockpileWealth: number
  itemsWealth: number
  cashWealth: number
  equipmentWealth: number
  weaponsWealth: number
}

/**
 * Member-summed wealth and its five parts; `who` names the collective.
 */
export function wealthColumns<T extends WealthComponentsRow>(
  totalKey: Key<T>,
  who: 'members' | 'citizens',
): ColumnDef<T>[] {
  return [
    compactNumberColumn<T>(totalKey, 'Total', {
      heat: 'median',
      width: 110,
      tooltip: `Combined wealth of all ${who} (companies + items + cash + equipment + weapons).`,
    }),
    compactNumberColumn<T>('companiesWealth' as Key<T>, 'Companies', {
      heat: 'median',
      width: 135,
      tooltip: `Combined company value across ${who}.`,
    }),
    compactNumberColumn<T>('stockpileWealth' as Key<T>, 'Stockpile', {
      heat: 'median',
      width: 120,
      tooltip: `Combined wealth of items + cash + equipment + weapons.`,
    }),
    compactNumberColumn<T>('itemsWealth' as Key<T>, 'Items', {
      heat: 'median',
      width: 100,
      tooltip: `Combined item value across ${who}.`,
    }),
    compactNumberColumn<T>('cashWealth' as Key<T>, 'Cash', {
      heat: 'median',
      width: 100,
      tooltip: `Combined cash across ${who}.`,
    }),
    compactNumberColumn<T>('equipmentWealth' as Key<T>, 'Equipment', {
      heat: 'median',
      width: 130,
      tooltip: `Combined equipment value across ${who}.`,
    }),
    compactNumberColumn<T>('weaponsWealth' as Key<T>, 'Weapons', {
      heat: 'median',
      width: 125,
      tooltip: `Combined weapon value across ${who}.`,
    }),
  ]
}

/**
 * Rows carrying the member-summed factory aggregates, the shape every group
 * table shares.
 */
interface FactoryStatsRow {
  factoryCount: number
  factoryPpPerDay: number
  factoryNetPerDay: number
  factoryEngineNetPerDay: number
  factoryEmployeeNetPerDay: number
  factoryWorkers: number
  factoryEfficiencyPct: number | null
  factoryPayrollPerDay: number
  employeeAvgPpPerDay: number | null
  employeeAvgNetPerDay: number | null
  employeeAvgHappiness: number | null
  employeeRetiringSoon: number
}

/**
 * Members' factories: count, profit split into Auto and Employees, payroll,
 * production and efficiency. Empty until the factory scrape has run.
 */
export function factoriesColumns<T extends FactoryStatsRow>(who: 'members' | 'citizens'): ColumnDef<T>[] {
  return [
    localeNumberColumn<T>('factoryCount' as Key<T>, '# Factories', {
      heat: 'ramp',
      width: 130,
      tooltip: `Total factories owned across ${who}.`,
    }),
    compactNumberColumn<T>('factoryNetPerDay' as Key<T>, 'Total / day', {
      heat: 'median',
      width: 120,
      tooltip: `Combined factory profit per day across ${who}: automated engines + NPC employees, net of employee and manager wages. Excludes self-work.`,
    }),
    compactNumberColumn<T>('factoryEngineNetPerDay' as Key<T>, 'Auto / day', {
      heat: 'median',
      width: 120,
      tooltip: `Profit per day from automated engines across ${who}.`,
    }),
    compactNumberColumn<T>('factoryEmployeeNetPerDay' as Key<T>, 'Employees / day', {
      heat: 'median',
      width: 155,
      tooltip: `Profit per day from NPC employees across ${who}, after their wages and the managers' wages.`,
    }),
    compactNumberColumn<T>('factoryPayrollPerDay' as Key<T>, 'Payroll / day', {
      heat: 'invertMedian',
      width: 140,
      tooltip: `Daily wages of NPC employees and managers across ${who}.`,
    }),
    compactNumberColumn<T>('factoryPpPerDay' as Key<T>, 'PP / day', {
      heat: 'median',
      width: 110,
      tooltip: `Combined production points per day across ${who}.`,
    }),
    percentColumn<T>('factoryEfficiencyPct' as Key<T>, 'Efficiency', {
      heat: 'median',
      decimals: 0,
      width: 115,
      tooltip: `Net as a share of the Top potential (the same production on the most profitable item). 100% = already on the best item.`,
    }),
  ]
}

/**
 * The Employees column group: NPC headcount, per-employee averages pooled over
 * every employee across `who`, and how many retire within a week. Shares the
 * factory row shape.
 */
export function employeesColumns<T extends FactoryStatsRow>(who: 'members' | 'citizens'): ColumnDef<T>[] {
  return [
    localeNumberColumn<T>('factoryWorkers' as Key<T>, '# Employees', {
      heat: 'ramp',
      width: 135,
      tooltip: `Total NPC employees across ${who}.`,
    }),
    compactNumberColumn<T>('employeeAvgPpPerDay' as Key<T>, 'Avg PP / day', {
      heat: 'median',
      width: 135,
      tooltip: `Production points per employee per day, over every employee across ${who}.`,
    }),
    compactNumberColumn<T>('employeeAvgNetPerDay' as Key<T>, 'Avg net / day', {
      heat: 'median',
      width: 140,
      tooltip: `Daily profit per employee across ${who}: output value minus wages, with the managers' wages shared out.`,
    }),
    compactNumberColumn<T>('employeeAvgHappiness' as Key<T>, 'Avg happiness', {
      heat: 'median',
      width: 150,
      tooltip: `Average happiness over every employee across ${who}. Below 50 hurts production.`,
    }),
    localeNumberColumn<T>('employeeRetiringSoon' as Key<T>, 'Retiring ≤7d', {
      heat: 'invertMedian',
      width: 135,
      tooltip: `Employees across ${who} retiring within a week.`,
    }),
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
 * Member-summed premium spend. Alliances have no premium aggregate.
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

/**
 * Header widths per rarity column; keys and order come from CASE_RARITIES.
 */
const CASE_RARITY_WIDTHS: Record<CaseRarity, number> = {
  common: 110,
  uncommon: 125,
  rare: 95,
  epic: 95,
  legendary: 125,
  mythic: 105,
}

/**
 * Opens per case type, luck, then a count per rarity. Log-scaled, since opens
 * span 1 to hundreds of thousands.
 */
export function casesColumns<T extends CasesRow>(): ColumnDef<T>[] {
  return [
    localeNumberColumn<T>('standardCasesOpened' as Key<T>, 'Standard Cases', {
      heat: 'ramp',
      heatLogScale: true,
      width: 155,
      tooltip: 'Standard cases opened.',
    }),
    localeNumberColumn<T>('mythicCasesOpened' as Key<T>, 'Mythic Cases', {
      heat: 'ramp',
      heatLogScale: true,
      width: 140,
      tooltip: 'Premium mythic cases opened.',
    }),
    percentColumn<T>('caseLuck' as Key<T>, 'Luck', {
      heat: 'median',
      center: 100,
      decimals: 1,
      width: 95,
      rankKey: 'caseLuckRank' as Key<T>,
      tooltip: `100% = exactly the published odds, higher = lucky. Premium cases count against premium odds. Hidden under ${MIN_LUCK_PULLS} pulls.`,
    }),
    ...CASE_RARITIES.map((rarity) => {
      const label = `${rarity[0].toUpperCase()}${rarity.slice(1)}`

      return localeNumberColumn<T>(`cases${label}` as Key<T>, label, {
        heat: 'ramp',
        heatLogScale: true,
        width: CASE_RARITY_WIDTHS[rarity],
      })
    }),
  ]
}
