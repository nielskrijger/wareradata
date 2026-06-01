import type { Equipment, GameConfig } from '@/lib/warera/api'

import { rarityTier } from '@/lib/gear/rarity'

/**
 * Gear quality scoring. The score answers "how strong is this loadout" on a
 * 0-100 scale that reads as a rarity tier: the item's rarity tier sets the band
 * (common … mythic), and the actual stat roll within that tier nudges the score
 * up or down inside the band. So a max-rolled Epic outscores a min-rolled Epic,
 * but both stay in the Epic band — and the band always matches the rarity rings
 * on the gear tiles.
 *
 * Earlier the score was "% of a perfectly-rolled mythic", which ran ~1 tier
 * below the items' named rarity (a full-Epic loadout scored ~40 → "Rare"). The
 * tier-anchored model below fixes that: full-Epic now scores in the 45-64 range,
 * squarely "Epic".
 */

// The item codes that fill the weapon slot, weakest to strongest. This is the
// one structural fact the config doesn't hand us (which items are weapons); each
// weapon's tier and roll bounds still come from the live config (its rarity and
// dynamicStats). Armor pieces follow the `{slot}{tier}` naming, so they need no
// such list.
const WEAPON_CODES = ['knife', 'gun', 'rifle', 'sniper', 'tank', 'jet'] as const

/**
 * A tiny lookup derived from the live config: each gear/ammo item code's rarity
 * tier (1..6), plus each ammo type's flat percent-attack bonus. Small enough
 * (a few hundred bytes) to ship to the browser, so client components (the gear
 * strip, the hover-card) can resolve tiers and ammo bonuses without the full
 * config or a hardcoded map.
 */
export interface GearLookup {
  tierByCode: Record<string, number>
  ammoBonusByCode: Record<string, number>
}

/**
 * Builds the {@link GearLookup} from the live gameConfig: every item's tier from
 * its `rarity`, and every item's flat percentAttack (ammo's under-tile bonus)
 * from its `flatStats`. The scrape always captures the config, so this replaces
 * the old hardcoded weapon/ammo tier maps and ammo-bonus table outright.
 */
export function deriveGearLookup(config: GameConfig): GearLookup {
  const items = (config.items ?? {}) as unknown as Record<string, { rarity?: string, flatStats?: { percentAttack?: number } } | undefined>
  const tierByCode: Record<string, number> = {}
  const ammoBonusByCode: Record<string, number> = {}
  for (const [code, item] of Object.entries(items)) {
    if (!item) {
      continue
    }
    const tier = rarityTier(item.rarity)
    if (tier) {
      tierByCode[code] = tier
    }
    const bonus = item.flatStats?.percentAttack
    if (typeof bonus === 'number') {
      ammoBonusByCode[code] = bonus
    }
  }
  return { tierByCode, ammoBonusByCode }
}

/**
 * Rarity tier (1..6) for an equipped item code, via the {@link GearLookup}.
 * Falls back to 1 for an unknown code (e.g. an item added since the last scrape).
 */
export function tierOfCode(code: string, lookup: GearLookup): number {
  return lookup.tierByCode[code] ?? 1
}

// Each gear slot's dominant rolled stat. The [min, max] roll range per rarity
// tier is read from the live game config (see {@link deriveSlotSpecs}); this map
// only fixes which stat each slot rolls (weapon → attack, helmet → crit dmg, …).
type Bounds = Record<number, [number, number]>
export interface SlotSpec { stat: string, bounds: Bounds }
const SLOT_STATS: Record<string, string> = {
  weapon: 'attack',
  helmet: 'criticalDamages',
  chest: 'armor',
  gloves: 'precision',
  pants: 'armor',
  boots: 'dodge',
}

/**
 * Builds the per-tier roll bounds from the live gameConfig's item catalog. Weapon
 * tiers come from each weapon's `rarity` (over the {@link WEAPON_CODES} list);
 * armor tiers from the `{slot}{tier}` codes (helmet4, chest2, …). The scrape
 * always captures the config, so this is the single source of the roll ranges —
 * they self-correct whenever the devs rebalance item stats.
 */
export function deriveSlotSpecs(config: GameConfig): Record<string, SlotSpec> {
  const items = config.items
  const out: Record<string, SlotSpec> = {}
  for (const [slot, stat] of Object.entries(SLOT_STATS)) {
    const bounds: Bounds = {}
    if (slot === 'weapon') {
      for (const code of WEAPON_CODES) {
        const tier = itemRarityTier(items, code)
        const range = itemStatRange(items, code, stat)
        if (tier && range) {
          bounds[tier] = range
        }
      }
    } else {
      for (let tier = 1; tier <= 6; tier++) {
        const range = itemStatRange(items, `${slot}${tier}`, stat)
        if (range) {
          bounds[tier] = range
        }
      }
    }
    out[slot] = { stat, bounds }
  }
  return out
}

// Reads an item's rarity tier (1..6, or 0 when unknown) out of gameConfig.items.
function itemRarityTier(items: unknown, code: string): number {
  if (!items || typeof items !== 'object') {
    return 0
  }
  const item = (items as Record<string, { rarity?: string } | undefined>)[code]
  return rarityTier(item?.rarity)
}

// Reads an item's [min, max] roll range for a stat out of gameConfig.items. The
// config types each item key specifically (no string index), so we narrow
// through `unknown`; a missing or malformed entry yields null.
function itemStatRange(items: unknown, code: string, stat: string): [number, number] | null {
  if (!items || typeof items !== 'object') {
    return null
  }
  const item = (items as Record<string, { dynamicStats?: Record<string, unknown> } | undefined>)[code]
  const arr = item?.dynamicStats?.[stat]
  if (Array.isArray(arr) && typeof arr[0] === 'number' && typeof arr[1] === 'number') {
    return [arr[0], arr[1]]
  }
  return null
}

// The seven slots that carry a rarity tier (weapon, ammo, five armor pieces).
// Fixed denominator so an empty slot scores 0 rather than shrinking the divisor.
const SCORE_SLOTS = ['weapon', 'ammo', 'helmet', 'chest', 'gloves', 'pants', 'boots'] as const

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x))
}

// A slot's contribution in [0, 1]: its tier (0-indexed) plus where the roll sits
// within that tier, all over 6. Tier 1 at min-roll ≈ 0; tier 6 at max-roll = 1.
// Empty slots contribute 0; ammo has no roll so it sits at its tier's center.
function slotScore(slot: string, piece: Equipment[keyof Equipment], specs: Record<string, SlotSpec>, lookup: GearLookup): number {
  if (!piece) {
    return 0
  }
  if (slot === 'ammo') {
    const tier = tierOfCode(piece as string, lookup)
    return (tier - 1 + 0.5) / 6
  }
  const code = typeof piece === 'string' ? piece : piece.code
  const spec = specs[slot]
  const tier = tierOfCode(code, lookup)
  const stat = typeof piece === 'string' ? undefined : (piece.skills as Record<string, number> | undefined)?.[spec.stat]
  let frac = 0.5
  if (stat != null) {
    const [lo, hi] = spec.bounds[tier] ?? [0, 1]
    frac = hi > lo ? clamp01((stat - lo) / (hi - lo)) : 0.5
  }
  return (tier - 1 + frac) / 6
}

/**
 * Gear score in 0-100: the mean of each tier-bearing slot's tier-plus-roll
 * contribution. Empty slots count as 0, so a half-equipped loadout reads lower.
 * Nothing equipped → 0; perfectly-rolled mythic in every slot → ~100.
 *
 * `specs` come from {@link deriveSlotSpecs} and `lookup` from {@link deriveGearLookup}
 * (both off the live config).
 */
export function computeGearScore(equipment: Equipment | undefined, specs: Record<string, SlotSpec>, lookup: GearLookup): number {
  if (!equipment) {
    return 0
  }
  let sum = 0
  for (const slot of SCORE_SLOTS) {
    sum += slotScore(slot, equipment[slot], specs, lookup)
  }
  return Math.round((sum / SCORE_SLOTS.length) * 100)
}

/**
 * Bucket a 0-100 gear score into a rarity tier (1-6). Because the score is
 * tier-anchored (see {@link computeGearScore}), the band lands on the loadout's
 * actual rarity: a full-Epic loadout scores ~45-64 and buckets as Epic (4).
 */
export function gearScoreTier(score: number | null | undefined): number {
  if (!score || score <= 0) {
    return 1
  }
  return Math.max(1, Math.min(6, Math.ceil((score / 100) * 6)))
}

/**
 * Rarity tier (1 common … 6 mythic) of a player's loadout, as the rounded mean
 * of its equipped pieces' actual item tiers (weapon + the five armor slots;
 * ammo excluded). Empty slots count as 0, so a half-equipped loadout reads
 * lower. Returns null when nothing tier-bearing is equipped.
 *
 * Reads each piece's tier from the live config via the {@link GearLookup} — the
 * most literal "what grade is this gear". {@link gearScoreTier} on the score
 * lands on the same band, so either can drive the pill color; this one is exact
 * when the equipment is in hand.
 */
export function computeGearTier(equipment: Equipment | undefined, lookup: GearLookup): number | null {
  if (!equipment) {
    return null
  }
  const slots = ['weapon', 'helmet', 'chest', 'gloves', 'pants', 'boots'] as const
  let sum = 0
  let present = 0
  for (const slot of slots) {
    const v = equipment[slot]
    if (!v) {
      continue
    }
    const code = typeof v === 'string' ? v : v.code
    sum += tierOfCode(code, lookup)
    present += 1
  }
  if (present === 0) {
    return null
  }
  return Math.max(1, Math.min(6, Math.round(sum / slots.length)))
}
