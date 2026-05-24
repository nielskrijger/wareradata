import { z } from 'zod'

export const RANKING_TIERS = ['bronze', 'silver', 'gold', 'platinum', 'diamond', 'master'] as const

export type RankingTier = (typeof RANKING_TIERS)[number]

const tier = z.enum(RANKING_TIERS).catch('bronze')

const rankingValue = z.object({ value: z.number(), rank: z.number(), tier }).optional()

const countryRankings = z
  .object({
    countryActivePopulation: rankingValue,
    countryBounty: rankingValue,
    countryDamages: rankingValue,
    countryDevelopment: rankingValue,
    countryProductionBonus: rankingValue,
    countryWealth: rankingValue,
    weeklyCountryDamages: rankingValue,
    weeklyCountryDamagesPerCitizen: rankingValue,
  })
  .partial()

export const country = z.looseObject({
  _id: z.string(),
  allies: z.array(z.string()).optional(),
  code: z.string(),
  development: z.number().optional(),
  money: z.number().optional(),
  name: z.string(),
  rankings: countryRankings.optional(),
  specializedItem: z.string().optional(),
  taxes: z.looseObject({
    income: z.number().optional(),
    market: z.number().optional(),
    selfWork: z.number().optional(),
  }).optional(),
  unrest: z.looseObject({
    bar: z.number().optional(),
    barMax: z.number().optional(),
  }).optional(),
  warsWith: z.array(z.string()).optional(),
})

export type Country = z.infer<typeof country>

export const countriesList = z.array(country)

export const RANKING_TYPES = [
  'weeklyCountryDamages',
  'weeklyCountryDamagesPerCitizen',
  'countryRegionDiff',
  'countryDevelopment',
  'countryActivePopulation',
  'countryDamages',
  'countryWealth',
  'countryProductionBonus',
  'countryBounty',
] as const

export type RankingType = (typeof RANKING_TYPES)[number]

export const rankingItem = z.looseObject({
  country: z.string().optional(),
  mu: z.string().optional(),
  rank: z.number(),
  tier,
  user: z.string().optional(),
  value: z.number(),
})

export const ranking = z.looseObject({
  _id: z.string(),
  type: z.string(),
  items: z.array(rankingItem),
})

export type RankingItem = z.infer<typeof rankingItem>
export type Ranking = z.infer<typeof ranking>

// --- Users ----------------------------------------------------------------

const rankingEntry = z.looseObject({
  value: z.number(),
  rank: z.number(),
  tier: tier.nullish(),
})

const leveling = z
  .looseObject({
    level: z.number(),
    totalXp: z.number().optional(),
  })
  .optional()

export const userLite = z.looseObject({
  _id: z.string(),
  username: z.string(),
  country: z.string(),
  isActive: z.boolean().optional(),
  leveling,
  rankings: z.record(z.string(), rankingEntry).nullish(),
  militaryRank: z.number().optional(),
  mu: z.string().nullish(),
  avatarUrl: z.string().nullish(),
  createdAt: z.string().optional(),
})

export type UserLite = z.infer<typeof userLite>
export const usersList = z.array(userLite)

/**
 * Paginated response for user.getUsersByCountry — items are partial (id+createdAt only).
 */
export const userIdItem = z.looseObject({
  _id: z.string(),
  createdAt: z.string().optional(),
})

export const usersByCountryPage = z.looseObject({
  items: z.array(userIdItem),
  nextCursor: z.string().nullish(),
})

// --- MUs ------------------------------------------------------------------

const muRankings = z
  .looseObject({
    muBounty: rankingEntry.optional(),
    muDamages: rankingEntry.optional(),
    muReputation: rankingEntry.optional(),
    muTerrain: rankingEntry.optional(),
    muWealth: rankingEntry.optional(),
    muWeeklyDamages: rankingEntry.optional(),
  })
  .optional()

export const mu = z.looseObject({
  _id: z.string(),
  activeUpgradeLevels: z.looseObject({
    dormitories: z.number().optional(),
    headquarters: z.number().optional(),
  }).optional(),
  avatarUrl: z.string().nullish(),
  createdAt: z.string().optional(),
  investedMoneyByUsers: z.record(z.string(), z.number()).optional(),
  members: z.array(z.string()).optional(),
  mercenaryReputation: z.number().optional(),
  name: z.string(),
  rankings: muRankings,
  region: z.string().optional(),
  updatedAt: z.string().optional(),
  user: z.string().optional(),
})

export type MU = z.infer<typeof mu>
export const musList = z.array(mu)

export const muPage = z.looseObject({
  items: z.array(mu),
  nextCursor: z.string().nullish(),
})

// --- Snapshot meta --------------------------------------------------------

export const snapshotMeta = z.looseObject({
  entityCounts: z.record(z.string(), z.number()).optional(),
  scrapedAt: z.string().optional(),
  scrapeDurationMs: z.number().optional(),
})

export type SnapshotMeta = z.infer<typeof snapshotMeta>
