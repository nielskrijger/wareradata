import type { FieldAliases } from '@/lib/query'

export { PREMIUM_KEYS, WEALTH_PART_KEYS } from '@/lib/rows/member-agg'

/**
 * Shared advanced-filter aliases and sort/filter passthrough keys for the
 * bundle field sets (cases, wealth components, premium spend) that repeat across
 * the table API routes. Each route spreads these into its own `aliases` /
 * `passthrough` and adds its entity-specific entries. Keep the friendly names in
 * sync with the popover cheatsheets in the matching `*-table.tsx`.
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
 * Cases sort/filter passthrough keys shared by every table: luck, the two
 * case-type opens, and the six per-rarity counts.
 */
export const CASE_SORT_KEYS = ['caseLuck', 'standardCasesOpened', 'mythicCasesOpened', 'casesCommon', 'casesUncommon', 'casesRare', 'casesEpic', 'casesLegendary', 'casesMythic'] as const

/**
 * Wealth-component filter aliases shared by every table.
 */
export const WEALTH_FIELD_ALIASES: FieldAliases = {
  companies: 'companiesWealth',
  items: 'itemsWealth',
  cash: 'cashWealth',
  equipment: 'equipmentWealth',
  weapons: 'weaponsWealth',
}

/**
 * Premium-spend filter aliases shared by the country / MU / party tables.
 */
export const PREMIUM_FIELD_ALIASES: FieldAliases = {
  gems: 'gemsPurchasedTotal',
  premiumMonths: 'premiumMonthsTotal',
  premiumGifts: 'premiumGiftsTotal',
}

/**
 * Combat sort/filter passthrough keys shared by the country / MU / alliance
 * tables: the member-summed damage total, its rank, and weekly damage. Bounty
 * and weekly-damage-per-citizen stay route-local (not every entity has them).
 */
export const COMBAT_SORT_KEYS = ['damage', 'damageRank', 'weeklyDamage'] as const

/**
 * Factories filter aliases shared by the country / MU / alliance tables.
 */
export const FACTORY_FIELD_ALIASES: FieldAliases = {
  factories: 'factoryCount',
  pp: 'factoryPpPerDay',
  factoryNet: 'factoryNetPerDay',
  auto: 'factoryEngineNetPerDay',
  workersNet: 'factoryEmployeeNetPerDay',
  workers: 'factoryWorkers',
  efficiency: 'factoryEfficiencyPct',
}

/**
 * Factories sort/filter passthrough keys shared by the country / MU / alliance
 * tables: production points/day (total + per-member), net gold/day, and
 * efficiency. Re-exported from {@link FACTORY_RANK_KEYS} so the sortable set and
 * the ranked set never drift.
 */
export { FACTORY_RANK_KEYS as FACTORY_SORT_KEYS } from '@/lib/rows/member-agg'
