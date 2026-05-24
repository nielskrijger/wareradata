/**
 * Per-user points formula. Adds three natural-unit values together so the
 * score reads as "raw potential": level worth a flat amount, damage scaled
 * down per 1k, wealth per 10 gold. Banned users are scored normally — they
 * already get a separate visual badge.
 */
const LEVEL_POINTS = 1_000 // points per level (lvl 50 = 50,000 pts)
const DAMAGE_DIVISOR = 2_000 // 1 pt per 2k damage (200M dmg = 100,000 pts)
const WEALTH_DIVISOR = 1 // 1 pt per gold (100K wealth = 100,000 pts)

interface PointsInput {
  level: number | null
  damageValue: number | null
  wealthValue: number | null
}

export interface PointsBreakdown {
  level: number
  damage: number
  wealth: number
  total: number
}

export function computePoints(u: PointsInput): PointsBreakdown {
  const level = Math.round((u.level ?? 0) * LEVEL_POINTS)
  const damage = Math.round((u.damageValue ?? 0) / DAMAGE_DIVISOR)
  const wealth = Math.round((u.wealthValue ?? 0) / WEALTH_DIVISOR)
  return { level, damage, wealth, total: level + damage + wealth }
}
