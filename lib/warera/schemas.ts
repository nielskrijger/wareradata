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
