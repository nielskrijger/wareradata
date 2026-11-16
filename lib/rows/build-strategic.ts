import type { StrategicBonusRow } from '@/lib/rows'
import type { StrategicBonuses } from '@/lib/warera/api'

/**
 * Copies of a resource needed for each bonus level: 1, 4 and 9 give
 * levels 1 to 3; copies in between add nothing.
 */
const LEVEL_THRESHOLDS = [1, 4, 9] as const

function resourceLevel(copies: number): number {
  return LEVEL_THRESHOLDS.filter(t => copies >= t).length
}

function toRow(b: StrategicBonuses): StrategicBonusRow {
  return {
    allianceId: b.allianceId ?? null,
    countryCount: b.countryIds?.length ?? 0,
    resources: Object.entries(b.regionIds ?? {})
      .map(([resource, ids]) => {
        const regionCount = Array.isArray(ids) ? ids.length : 0

        return { resource, regionCount, level: resourceLevel(regionCount) }
      })
      .filter(r => r.regionCount > 0)
      .sort((a, c) => c.regionCount - a.regionCount),
    skills: Object.entries(b.bonuses?.skills ?? {})
      .filter(([, value]) => typeof value === 'number' && value !== 0)
      .map(([skill, value]) => ({ skill, value }))
      .sort((a, c) => c.value - a.value),
  }
}

/**
 * Resolves the per-country strategic resource bonuses into display rows, keyed
 * by country id and (for alliance members, who all share one bonus) by
 * alliance id. Empty when the snapshot has no bonuses.
 */
export function buildStrategicRows(raw: Record<string, StrategicBonuses> | undefined): {
  byCountry: Record<string, StrategicBonusRow>
  byAlliance: Record<string, StrategicBonusRow>
} {
  const byCountry: Record<string, StrategicBonusRow> = {}
  const byAlliance: Record<string, StrategicBonusRow> = {}
  for (const [countryId, bonus] of Object.entries(raw ?? {})) {
    const row = toRow(bonus)
    byCountry[countryId] = row
    if (row.allianceId) {
      byAlliance[row.allianceId] ??= row
    }
  }

  return { byCountry, byAlliance }
}
