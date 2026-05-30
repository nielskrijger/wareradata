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
