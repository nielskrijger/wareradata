/**
 * Rarity palette shared by every gear-rendering surface, tier 1 (common) to
 * tier 6 (mythic). CSS variables so light surfaces get darker, readable shades
 * (defined in globals.css).
 */
const RARITY_COLORS = [
  'var(--rarity-1)', // common
  'var(--rarity-2)', // uncommon
  'var(--rarity-3)', // rare
  'var(--rarity-4)', // epic
  'var(--rarity-5)', // legendary
  'var(--rarity-6)', // mythic
] as const

const RARITY_LABELS = [
  'Common',
  'Uncommon',
  'Rare',
  'Epic',
  'Legendary',
  'Mythic',
] as const

export function rarityColor(tier: number): string {
  return RARITY_COLORS[Math.max(0, Math.min(5, tier - 1))]
}

/**
 * A rarity colour at `percent` opacity, for tile fills and rings.
 */
export function rarityTint(color: string, percent: number): string {
  return `color-mix(in oklab, ${color} ${percent}%, transparent)`
}

export function rarityLabel(tier: number): string {
  return RARITY_LABELS[Math.max(0, Math.min(5, tier - 1))]
}

/**
 * Rarity name as the API spells it → tier 1..6 (the inverse of RARITY_LABELS).
 * Lets gear code read an item's tier straight off its config `rarity` string.
 */
const RARITY_TIER: Record<string, number> = {
  common: 1,
  uncommon: 2,
  rare: 3,
  epic: 4,
  legendary: 5,
  mythic: 6,
}

/**
 * Tier (1 common … 6 mythic) for a config rarity name, or 0 when the name is
 * missing/unknown so callers can treat it as "no tier".
 */
export function rarityTier(name: string | null | undefined): number {
  return name ? (RARITY_TIER[name] ?? 0) : 0
}
