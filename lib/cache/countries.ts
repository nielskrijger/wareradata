import type { Range } from '@/lib/query'
import type { CountryRow } from '@/lib/rows'

import { computeRanges } from '@/lib/query'

import { getSnapshot } from './memory'

import 'server-only'

export interface CountryDetails {
  country: CountryRow

  /**
   * Per-field [min, max, median] over the full country set, mirroring the shape
   * the data table's HeatCell uses so the hover-card can heat-tint values
   * against the same baseline.
   */
  ranges: Record<string, Range>
  total: number
}

/**
 * One country plus the ranges that heat-tint it, for its hover card.
 */
export async function getCountryById(id: string): Promise<CountryDetails | null> {
  const { countries } = await getSnapshot()
  const country = countries.find(c => c.id === id)
  if (!country) {
    return null
  }

  return { country, ranges: computeRanges(countries), total: countries.length }
}
