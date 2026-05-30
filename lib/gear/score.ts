import type { Equipment } from '@/lib/warera/api'

/**
 * Per-piece slot maxes for each stat, taken from the top-tier item in the
 * catalog. Used as the denominator when normalizing a piece's actual roll
 * into a 0-100 score:
 *   weaponAttack       300  (jet)
 *   weaponCritChance    50  (jet)
 *   helmetCritDamages  150  (helmet6)
 *   chestArmor          70  (chest6)
 *   pantsArmor          70  (pants6)
 *   glovesPrecision     60  (gloves6)
 *   bootsDodge          60  (boots6)
 *   ammoPercentAttack   40  (heavyAmmo, flat)
 */
const STAT_MAX = {
  attack: 300,
  criticalChance: 50,
  percentAttack: 40,
  criticalDamages: 150,
  armor: 70,
  precision: 60,
  dodge: 60,
} as const

// Ammo carries a flat percentAttack value rather than a per-piece roll.
const AMMO_PERCENT_ATTACK: Record<string, number> = {
  lightAmmo: 10,
  ammo: 20,
  heavyAmmo: 40,
}

// 8 stat slots total: weapon contributes attack + criticalChance, ammo
// contributes percentAttack, each of the 5 armor pieces contributes its
// own stat. Fixed denominator so an unequipped slot scores 0 rather than
// changing the divisor.
const SCORE_DENOMINATOR = 8

/**
 * Gear score in 0-100, computed as the average of each stat's roll
 * normalized against the global top-tier max for its slot. Empty slots
 * contribute 0. A player wearing perfectly-rolled mythic in every slot +
 * heavy ammo scores 100; one wearing nothing scores 0.
 */
export function computeGearScore(equipment: Equipment | undefined): number {
  if (!equipment) {
    return 0
  }

  let sum = 0
  const w = equipment.weapon
  sum += w?.skills?.attack ? (w.skills.attack / STAT_MAX.attack) * 100 : 0
  sum += w?.skills?.criticalChance ? (w.skills.criticalChance / STAT_MAX.criticalChance) * 100 : 0

  sum += equipment.ammo ? ((AMMO_PERCENT_ATTACK[equipment.ammo] ?? 0) / STAT_MAX.percentAttack) * 100 : 0

  const h = equipment.helmet
  sum += h?.skills?.criticalDamages ? (h.skills.criticalDamages / STAT_MAX.criticalDamages) * 100 : 0
  const c = equipment.chest
  sum += c?.skills?.armor ? (c.skills.armor / STAT_MAX.armor) * 100 : 0
  const g = equipment.gloves
  sum += g?.skills?.precision ? (g.skills.precision / STAT_MAX.precision) * 100 : 0
  const p = equipment.pants
  sum += p?.skills?.armor ? (p.skills.armor / STAT_MAX.armor) * 100 : 0
  const b = equipment.boots
  sum += b?.skills?.dodge ? (b.skills.dodge / STAT_MAX.dodge) * 100 : 0

  return Math.round(sum / SCORE_DENOMINATOR)
}

/**
 * Bucket a 0-100 gear score into a rarity tier (1-6). The score "lands at"
 * the rarity a fully-equipped player of that tier would be at — so 50% reads
 * as rare, 67% as epic, 83% as legendary, 100% as mythic. Uses ceil so any
 * fractional improvement bumps the player into the next tier.
 *
 * Centralized here so the same banding drives the gear-pill color on the
 * hover-card, the user detail page, and any future leaderboard surfacing.
 */
export function gearScoreTier(score: number | null | undefined): number {
  if (!score || score <= 0) {
    return 1
  }
  return Math.max(1, Math.min(6, Math.ceil((score / 100) * 6)))
}
