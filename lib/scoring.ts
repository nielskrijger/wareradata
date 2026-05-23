/**
 * Per-user points formula. Adds three natural-unit values together so the
 * score reads as "raw potential": level worth a flat amount, damage scaled
 * down per 1k, wealth per 10 gold. Banned users are scored normally — they
 * already get a separate visual badge.
 */
const LEVEL_POINTS = 1_000 // points per level (lvl 50 = 50,000 pts)
const DAMAGE_DIVISOR = 1_000 // 1 pt per 1k damage (200M dmg = 200,000 pts)
const WEALTH_DIVISOR = 10 // 1 pt per 10 gold  (100K wealth = 10,000 pts)

interface PointsInput {
  level: number | null
  damageValue: number | null
  wealthValue: number | null
}

export function computePoints(u: PointsInput): number {
  const level = u.level ?? 0
  const damage = u.damageValue ?? 0
  const wealth = u.wealthValue ?? 0
  return Math.round(
    level * LEVEL_POINTS + damage / DAMAGE_DIVISOR + wealth / WEALTH_DIVISOR,
  )
}
