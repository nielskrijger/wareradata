/**
 * War / Eco / Hybrid from a user's trained skills.
 *
 * Every skill shares one level cost curve, so summing costs over a set of
 * skills gives comparable points invested per discipline.
 */

import type { GameConfig } from '@/lib/warera/api'

/**
 * Combat skills count toward "War".
 */
export const WAR_SKILLS = ['attack', 'armor', 'criticalChance', 'criticalDamages', 'dodge', 'precision'] as const

/**
 * Pure-economy skills count toward "Eco". `lootChance` is intentionally
 * excluded: it's battle-adjacent income (you only loot by fighting), so it
 * muddies the split rather than cleanly belonging to either side.
 */
export const ECO_SKILLS = ['management', 'companies', 'production'] as const

/**
 * A player is decisively War/Eco once their points lean past this share of the
 * war+eco total; the band in between reads as Hybrid.
 */
const WAR_THRESHOLD = 0.6
const ECO_THRESHOLD = 0.4

export type CombatMode = 'war' | 'eco' | 'hybrid' | 'untrained'

function pointsForLevel(level: number | undefined, costs: readonly number[]): number {
  if (!level || level <= 0) {
    return 0
  }

  return costs[Math.min(costs.length - 1, Math.floor(level))] ?? 0
}

/**
 * The cumulative cost curve from the live config, so it follows any retune.
 */
export function deriveSkillPointCost(config: GameConfig): readonly number[] {
  const levels = (config.skills as unknown as { attack?: {
    levels?: Record<string, { totalCost?: number }>
  } } | undefined)?.attack?.levels

  const costs: number[] = []
  for (let level = 0; level <= 10; level++) {
    const cost = levels?.[String(level)]?.totalCost
    if (typeof cost !== 'number') {
      break
    }

    costs[level] = cost
  }

  return costs
}

/**
 * Points invested across the named skills.
 *
 * `skills` is `unknown` so callers can pass the API's fixed-key `UserSkills`
 * without a cast.
 */
export function skillPoints(skills: unknown, names: readonly string[], costs: readonly number[]): number {
  if (!skills || typeof skills !== 'object') {
    return 0
  }

  const bag = skills as Record<string, { level?: number } | undefined>
  let sum = 0
  for (const name of names) {
    sum += pointsForLevel(bag[name]?.level, costs)
  }

  return sum
}

/**
 * Null share is 'untrained'; ≥ 0.6 'war', ≤ 0.4 'eco', else 'hybrid'.
 */
export function classifyWarShare(warShare: number | null): CombatMode {
  if (warShare === null) {
    return 'untrained'
  }

  if (warShare >= WAR_THRESHOLD) {
    return 'war'
  }

  if (warShare <= ECO_THRESHOLD) {
    return 'eco'
  }

  return 'hybrid'
}

/**
 * Classify a player from their war and eco point totals. With no investment in
 * either, they're 'untrained'; otherwise the war share of the war+eco total
 * decides via {@link classifyWarShare}.
 */
export function classifyCombatMode(warPoints: number, ecoPoints: number): CombatMode {
  const total = warPoints + ecoPoints

  return classifyWarShare(total > 0 ? warPoints / total : null)
}
