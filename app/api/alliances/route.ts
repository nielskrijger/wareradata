import type { FieldAliases } from '@/lib/query'
import type { AllianceRow } from '@/lib/rows'

import { getSnapshot } from '@/lib/cache/memory'
import { createTableRoute, makeSortValue } from '@/lib/query'
import { TIER_INDEX } from '@/lib/warera/api'

/**
 * Friendly field names for the advanced filter. Keep in sync with the
 * popover cheatsheet in `alliances-table.tsx`. `country` matches against the
 * concatenated member names + codes, so `country:netherlands` (or `country:nl`)
 * finds the alliances a country belongs to.
 */
const allianceFieldAliases: FieldAliases = {
  cases: 'casesOpenedTotal',
  luck: 'caseLuck',
  common: 'casesCommon',
  uncommon: 'casesUncommon',
  rare: 'casesRare',
  epic: 'casesEpic',
  legendary: 'casesLegendary',
  mythic: 'casesMythic',
  cash: 'cashWealth',
  companies: 'companiesWealth',
  country: 'memberNames',
  damage: 'totalDamage',
  dev: 'development',
  equipment: 'equipmentWealth',
  founded: 'createdAt',
  items: 'itemsWealth',
  leader: 'leaderName',
  members: 'memberCount',
  points: 'totalPoints',
  ppd: 'avgPointsPerDay',
  wealth: 'citizenWealth',
  weapons: 'weaponsWealth',
  weekly: 'weeklyDamage',
}

const allianceSortValue = makeSortValue<AllianceRow>({
  passthrough: [
    'caseLuck',
    'standardCasesOpened',
    'mythicCasesOpened',
    'casesCommon',
    'casesUncommon',
    'casesRare',
    'casesEpic',
    'casesLegendary',
    'casesMythic',
    'totalPoints',
    'avgPoints',
    'avgPointsPerDay',
    'population',
    'populationRank',
    'development',
    'developmentRank',
    'coreDevelopment',
    'coreDevelopmentRank',
    'averageDevelopment',
    'averageDevelopmentRank',
    'totalDamage',
    'weeklyDamage',
    'weeklyDamagePerCitizen',
    'memberCount',
    'citizenWealth',
    'companiesWealth',
    'itemsWealth',
    'cashWealth',
    'equipmentWealth',
    'weaponsWealth',
    'createdAt',
  ],
  text: ['name', 'leaderName'],
  custom: {
    developmentTier: row => (row.developmentTier ? TIER_INDEX[row.developmentTier] : null),
  },
  default: 'totalPoints',
})

/**
 * Driven by the client DataTable on /alliances. Reads from the in-process
 * snapshot cache, then filters, sorts, and paginates in memory.
 */
export const GET = createTableRoute<AllianceRow>(
  async () => (await getSnapshot()).alliances,
  allianceSortValue,
  allianceFieldAliases,
)
