import type { FieldAliases } from '@/lib/query'

/**
 * Filter aliases for the field sets shared across table routes. Keep the
 * friendly names in sync with the cheatsheets in the matching `*-table.tsx`.
 */

/**
 * Cases filter aliases shared by every table. The `cases:` alias itself differs
 * per table (group rows expose casesOpenedTotal, users casesOpened), so each
 * route adds that one.
 */
export const CASE_FIELD_ALIASES: FieldAliases = {
  luck: 'caseLuck',
  common: 'casesCommon',
  uncommon: 'casesUncommon',
  rare: 'casesRare',
  epic: 'casesEpic',
  legendary: 'casesLegendary',
  mythic: 'casesMythic',
}

/**
 * Wealth-component filter aliases shared by every table.
 */
export const WEALTH_FIELD_ALIASES: FieldAliases = {
  companies: 'companiesWealth',
  stockpile: 'stockpileWealth',
  items: 'itemsWealth',
  cash: 'cashWealth',
  equipment: 'equipmentWealth',
  weapons: 'weaponsWealth',
}

/**
 * Premium-spend filter aliases shared by the group tables.
 */
export const PREMIUM_FIELD_ALIASES: FieldAliases = {
  gems: 'gemsPurchasedTotal',
  premiumMonths: 'premiumMonthsTotal',
  premiumGifts: 'premiumGiftsTotal',
}

/**
 * Factories filter aliases shared by every table.
 */
export const FACTORY_FIELD_ALIASES: FieldAliases = {
  factories: 'factoryCount',
  pp: 'factoryPpPerDay',
  factoryNet: 'factoryNetPerDay',
  auto: 'factoryEngineNetPerDay',
  workersNet: 'factoryEmployeeNetPerDay',
  employeesNet: 'factoryEmployeeNetPerDay',
  workers: 'factoryWorkers',
  employees: 'factoryWorkers',
  efficiency: 'factoryEfficiencyPct',
  payroll: 'factoryPayrollPerDay',
  openSlots: 'factoryOpenSlots',
  slots: 'factoryOpenSlots',
  avgPp: 'employeeAvgPpPerDay',
  avgNet: 'employeeAvgNetPerDay',
  happiness: 'employeeAvgHappiness',
  retiring: 'employeeRetiringSoon',
}

/**
 * Aliases every group table (alliance / country / MU / party) shares.
 */
export const GROUP_FIELD_ALIASES: FieldAliases = {
  ...CASE_FIELD_ALIASES,
  ...WEALTH_FIELD_ALIASES,
  ...PREMIUM_FIELD_ALIASES,
  ...FACTORY_FIELD_ALIASES,
  cases: 'casesOpenedTotal',
  points: 'totalPoints',
  ppd: 'avgPointsPerDay',
}
