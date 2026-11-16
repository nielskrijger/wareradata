/*
 * Per-user points formula. Adds three natural-unit values together so the
 * score reads as "raw potential": level and prestige worth a flat amount,
 * damage scaled down per 2k, wealth per gold. Banned users are scored normally — they
 * already get a separate visual badge.
 */

/**
 * Points per level (level 50 = 50,000 points).
 */
const LEVEL_POINTS = 1_000

/**
 * Points per prestige: its permanent bonus skill level is worth a level-10
 * skill's 10 skill points, or 2.5 levels at 4 skill points per level.
 */
const PRESTIGE_POINTS = 2_500

/**
 * Damage per point (200M damage = 100,000 points).
 */
const DAMAGE_DIVISOR = 2_000

/**
 * Gold of wealth per point (100K wealth = 100,000 points).
 */
const WEALTH_DIVISOR = 1

interface PointsInput {
  level: number | null
  prestige: number | null
  damage: number | null
  wealth: number | null
}

export interface PointsBreakdown {
  /**
   * Level and prestige together; both stand for skill points.
   */
  level: number
  damage: number
  wealth: number
  total: number
}

export function computePoints(u: PointsInput): PointsBreakdown {
  const level = Math.round((u.level ?? 0) * LEVEL_POINTS + (u.prestige ?? 0) * PRESTIGE_POINTS)
  const damage = Math.round((u.damage ?? 0) / DAMAGE_DIVISOR)
  const wealth = Math.round((u.wealth ?? 0) / WEALTH_DIVISOR)

  return { level, damage, wealth, total: level + damage + wealth }
}
