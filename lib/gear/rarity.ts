import { RARITY_COLOR } from '@/components/colors'

const RARITY_LABELS = [
  'Common',
  'Uncommon',
  'Rare',
  'Epic',
  'Legendary',
  'Mythic',
] as const

export function rarityColor(tier: number): string {
  return RARITY_COLOR[Math.max(0, Math.min(5, tier - 1))]
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
