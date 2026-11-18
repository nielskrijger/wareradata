import type { ColumnDef } from './features'

import type { CaseRarity } from '@/lib/warera/api'

import { MIN_LUCK_PULLS } from '@/lib/cases'
import { CASE_RARITIES } from '@/lib/warera/api'

import {
  compactNumberColumn,
  localeNumberColumn,
  percentColumn,
  pointsBreakdownColumn,
} from './column-factories'

/**
 * Whole-category column groups shared by the group tables (MUs, countries,
 * parties, alliances). Groups that also fit one player take an optional `who`
 * and are shared with /users.
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
  totalPointsRank: number | null
  levelPoints: number
  damagePoints: number
  wealthPoints: number
  avgPoints: number | null
  avgPointsPerDay: number | null
}

/**
 * The three parts a points total is built from, as their own sortable columns
 * (the Points cell only shows them on hover). Shared with /users; `who` names
 * the members whose points are summed, or is omitted for a single player.
 */
export function pointsSplitColumns<
  T extends { levelPoints: number, damagePoints: number, wealthPoints: number },
>(who?: 'members' | 'citizens'): ColumnDef<T>[] {
  const across = who ? `, summed across ${who}` : ''
  const opts = { heat: 'median', width: 110, hiddenByDefault: true } as const

  return [
    localeNumberColumn<T>('levelPoints' as Key<T>, 'Level', {
      ...opts,
      tooltip: `Points from level and prestige (1,000 per level, 2,500 per prestige)${across}.`,
    }),
    localeNumberColumn<T>('damagePoints' as Key<T>, 'Damage', {
      ...opts,
      tooltip: `Points from total damage (1 per 2,000 damage)${across}.`,
    }),
    localeNumberColumn<T>('wealthPoints' as Key<T>, 'Wealth', {
      ...opts,
      tooltip: `Points from wealth (1 per gold)${across}.`,
    }),
  ]
}

/**
 * Member-summed total points with its rank and the per-member averages in its
 * tooltip, the averages as their own columns (for sorting), and the
 * level / damage / wealth split. `who` names the collective in the tooltips.
 */
export function pointsColumns<T extends PointsRow>(who: 'members' | 'citizens'): ColumnDef<T>[] {
  const one = who.slice(0, -1)

  return [
    pointsBreakdownColumn<T>('totalPoints' as Key<T>, 'Points', {
      tooltip: `Combined points of all ${who}.`,
      rankKey: 'totalPointsRank' as Key<T>,
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
    ...pointsSplitColumns<T>(who),
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
 * Rows carrying the factory aggregates: one player's (nullable until scraped)
 * or summed across a group's members.
 */
interface FactoryStatsRow {
  factoryCount: number | null
  factoryPpPerDay: number | null
  factoryNetPerDay: number | null
  factoryEngineNetPerDay: number | null
  factoryEmployeeNetPerDay: number | null
  factoryWorkers: number | null
  factoryOpenSlots: number | null
  factoryEfficiencyPct: number | null
  factoryPayrollPerDay: number | null
  employeeAvgPpPerDay: number | null
  employeeAvgNetPerDay: number | null
  employeeAvgHappiness: number | null
  employeeRetiringSoon: number | null
}

/**
 * Tooltip wording for whose factories a column covers: a group's members or
 * citizens, or one player when `who` is omitted.
 */
function factoryScope(who?: 'members' | 'citizens') {
  return {
    across: who ? ` across ${who}` : '',
    whose: who ? `${who}'` : 'this player\'s',
  }
}

/**
 * Factories: count, profit split into Auto and Employees, production and
 * efficiency. Shared with /users; empty until the factory scrape has run.
 */
export function factoriesColumns<T extends FactoryStatsRow>(who?: 'members' | 'citizens'): ColumnDef<T>[] {
  const { across, whose } = factoryScope(who)

  return [
    localeNumberColumn<T>('factoryCount' as Key<T>, '# Factories', {
      heat: 'ramp',
      width: 130,
      tooltip: `Factories owned${across}.`,
    }),
    compactNumberColumn<T>('factoryNetPerDay' as Key<T>, 'Total / day', {
      heat: 'median',
      width: 120,
      tooltip: `Factory profit per day${across}: automated engines + NPC employees, net of employee and manager wages. Excludes self-work.`,
    }),
    compactNumberColumn<T>('factoryEngineNetPerDay' as Key<T>, 'Auto / day', {
      heat: 'median',
      width: 120,
      tooltip: `Profit per day from ${whose} automated engines.`,
    }),
    compactNumberColumn<T>('factoryEmployeeNetPerDay' as Key<T>, 'Employees / day', {
      heat: 'median',
      width: 155,
      tooltip: `Profit per day from ${whose} NPC employees, after their wages and the managers' wages.`,
    }),
    compactNumberColumn<T>('factoryPpPerDay' as Key<T>, 'PP / day', {
      heat: 'median',
      width: 110,
      tooltip: `Production points per day${across}.`,
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
 * Employees: NPC headcount, open slots, payroll, per-employee averages pooled
 * over every employee, and how many retire within a week. Shared with /users.
 */
export function employeesColumns<T extends FactoryStatsRow>(who?: 'members' | 'citizens'): ColumnDef<T>[] {
  const { across, whose } = factoryScope(who)

  return [
    localeNumberColumn<T>('factoryWorkers' as Key<T>, '# Employees', {
      heat: 'ramp',
      width: 135,
      tooltip: `NPC employees${across}.`,
    }),
    localeNumberColumn<T>('factoryOpenSlots' as Key<T>, 'Open slots', {
      heat: 'median',
      width: 125,
      tooltip: `Employee slots left to fill in ${whose} factories: capacity minus headcount.`,
    }),
    compactNumberColumn<T>('factoryPayrollPerDay' as Key<T>, 'Payroll / day', {
      heat: 'invertMedian',
      width: 140,
      tooltip: `Daily wages of ${whose} NPC employees and managers.`,
    }),
    compactNumberColumn<T>('employeeAvgPpPerDay' as Key<T>, 'Avg PP / day', {
      heat: 'median',
      width: 135,
      tooltip: `Production points per employee per day${across}.`,
    }),
    compactNumberColumn<T>('employeeAvgNetPerDay' as Key<T>, 'Avg net / day', {
      heat: 'median',
      width: 140,
      tooltip: `Daily profit per employee${across}: output value minus wages, with the managers' wages shared out.`,
    }),
    compactNumberColumn<T>('employeeAvgHappiness' as Key<T>, 'Avg happiness', {
      heat: 'median',
      width: 150,
      tooltip: `Average employee happiness${across}. Below 50 hurts production.`,
    }),
    localeNumberColumn<T>('employeeRetiringSoon' as Key<T>, 'Retiring ≤7d', {
      heat: 'invertMedian',
      width: 135,
      tooltip: `Employees${across} retiring within a week.`,
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
      rankLabel: 'Case luck',
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
