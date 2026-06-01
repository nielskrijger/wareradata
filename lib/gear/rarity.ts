/**
 * Rarity palette shared by every gear-rendering surface: the tile rings on
 * the gear strip, the score pill on the hover-card, and any future ranking
 * UI that needs the same color language.
 *
 * Tier 1 (common, neutral) → tier 6 (mythic, fuchsia). Kept as raw hex so
 * the same color can drive a Tailwind ring (via inline style) and an
 * inline rgb-tinted background without round-tripping through CSS variables.
 */
export const RARITY_HEX = [
  '#a3a3a3', // 1 common
  '#34d399', // 2 uncommon
  '#60a5fa', // 3 rare
  '#c4b5fd', // 4 epic
  '#fcd34d', // 5 legendary
  '#f87171', // 6 mythic
] as const

export const RARITY_LABELS = [
  'Common',
  'Uncommon',
  'Rare',
  'Epic',
  'Legendary',
  'Mythic',
] as const

export function rarityHex(tier: number): string {
  return RARITY_HEX[Math.max(0, Math.min(5, tier - 1))]
}

export function rarityLabel(tier: number): string {
  return RARITY_LABELS[Math.max(0, Math.min(5, tier - 1))]
}

// Rarity name as the API spells it → tier 1..6 (the inverse of RARITY_LABELS).
// Lets gear code read an item's tier straight off its config `rarity` string.
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
