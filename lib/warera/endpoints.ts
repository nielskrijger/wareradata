import type { Country, Ranking, RankingType } from './schemas'
import { trpcQuery } from './client'
import { countriesList, ranking } from './schemas'

export function getAllCountries(): Promise<Country[]> {
  return trpcQuery('country.getAllCountries', undefined, countriesList)
}

export function getRanking(rankingType: RankingType): Promise<Ranking> {
  return trpcQuery('ranking.getRanking', { rankingType }, ranking)
}
