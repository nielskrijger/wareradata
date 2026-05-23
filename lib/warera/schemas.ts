import { z } from 'zod'

export const RANKING_TIERS = ['bronze', 'silver', 'gold', 'platinum', 'diamond', 'master'] as const

export type RankingTier = (typeof RANKING_TIERS)[number]

const tier = z.enum(RANKING_TIERS).catch('bronze')

const countryRankings = z
  .object({
    countryDamages: z.object({ value: z.number(), rank: z.number(), tier }).optional(),
    weeklyCountryDamages: z.object({ value: z.number(), rank: z.number(), tier }).optional(),
    countryWealth: z.object({ value: z.number(), rank: z.number(), tier }).optional(),
    countryDevelopment: z.object({ value: z.number(), rank: z.number(), tier }).optional(),
    countryActivePopulation: z.object({ value: z.number(), rank: z.number(), tier }).optional(),
  })
  .partial()

export const country = z.looseObject({
  _id: z.string(),
  name: z.string(),
  code: z.string(),
  money: z.number().optional(),
  development: z.number().optional(),
  rankings: countryRankings.optional(),
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
  user: z.string().optional(),
  mu: z.string().optional(),
  value: z.number(),
  rank: z.number(),
  tier,
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
    muWeeklyDamages: rankingEntry.optional(),
    muBounty: rankingEntry.optional(),
    muDamages: rankingEntry.optional(),
    muTerrain: rankingEntry.optional(),
    muWealth: rankingEntry.optional(),
  })
  .optional()

export const mu = z.looseObject({
  _id: z.string(),
  name: z.string(),
  user: z.string().optional(),
  region: z.string().optional(),
  members: z.array(z.string()).optional(),
  rankings: muRankings,
  avatarUrl: z.string().nullish(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
})

export type MU = z.infer<typeof mu>
export const musList = z.array(mu)

export const muPage = z.looseObject({
  items: z.array(mu),
  nextCursor: z.string().nullish(),
})

// --- Snapshot meta --------------------------------------------------------

export const snapshotMeta = z.looseObject({
  scrapedAt: z.string().optional(),
  entityCounts: z.record(z.string(), z.number()).optional(),
  scrapeDurationMs: z.number().optional(),
})

export type SnapshotMeta = z.infer<typeof snapshotMeta>
