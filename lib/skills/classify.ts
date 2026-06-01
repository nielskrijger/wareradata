/**
 * War / Eco / Hybrid classification from a user's trained skills.
 *
 * Players spend skill points specializing toward combat ("War"), economy
 * ("Eco"), or a mix ("Hybrid"). Each of the 14 skills has a trained `level`
 * (0-10); the cost to reach a level is identical across every skill, verified
 * against `gameConfig.getGameConfig` — so summing the per-level cost over a set
 * of skills gives comparable "points invested" in that discipline.
 *
 * Mirrors the shape of `lib/gear/score.ts`: the cost curve and skill sets come
 * from the live game config plus small pure functions, no dependency on the API
 * package's exact types.
 */

import type { GameConfig } from '@/lib/warera/api'

// Combat skills count toward "War".
export const WAR_SKILLS = ['attack', 'armor', 'criticalChance', 'criticalDamages', 'dodge', 'precision'] as const

// Pure-economy skills count toward "Eco". `lootChance` is intentionally
// excluded: it's battle-adjacent income (you only loot by fighting), so it
// muddies the split rather than cleanly belonging to either side.
export const ECO_SKILLS = ['management', 'companies', 'entrepreneurship', 'production'] as const

// A player is decisively War/Eco once their points lean past this share of the
// war+eco total; the band in between reads as Hybrid.
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
 * Builds the per-level cumulative cost curve from the live gameConfig. Reads any
 * trainable skill's track (they all share one curve). The scrape always captures
 * the config, so this is the single source of the cost curve — it self-corrects
 * if the devs retune skill costs.
 */
export function deriveSkillPointCost(config: GameConfig): readonly number[] {
  const levels = (config.skills as unknown as { attack?: { levels?: Record<string, { totalCost?: number }> } } | undefined)?.attack?.levels
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
 * Total points invested across the named skills, by summing each skill's
 * trained-level cost. Unknown or untrained skills contribute 0.
 *
 * Takes the skills bag as `unknown` and narrows internally so callers can pass
 * the API package's `UserSkills` (a fixed-key interface) without a cast — we
 * only ever index it by name and read `.level`. `costs` come from
 * {@link deriveSkillPointCost} (the live config's cost curve).
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
 * Classify from a war share (war / (war + eco)) already computed — used for both
 * a single player and an aggregated mean across an entity's members. Null share
 * (no investment / no trained members) is 'untrained'; otherwise >= 0.6 → 'war',
 * <= 0.4 → 'eco', else 'hybrid'.
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
