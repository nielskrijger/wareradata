import type { Equipment } from '@/lib/warera/api'

import { Footprints, Hand, HardHat, Shield, Sword, Target } from 'lucide-react'
import Image from 'next/image'

import { rarityHex } from '@/lib/gear/rarity'
import { cn } from '@/lib/utils'

// Slot order mirrors the in-game UI (weapon, ammo, head, chest, gloves,
// pants, shoes). Layout downstream depends on this order; do not reshuffle.
const SLOT_ORDER = ['weapon', 'ammo', 'helmet', 'chest', 'gloves', 'pants', 'boots'] as const
type Slot = (typeof SLOT_ORDER)[number]

// Tier per slot. Armor pieces carry the tier as a trailing digit in the
// item code (helmet1..6). Weapons and ammo have categorical tiers we
// hard-map. Falls back to 1 for anything we don't recognize.
//
// Ammo tiers map to the game's rarity colors (uncommon / rare / epic), not
// a sequential 1/2/3 — the in-game tooltips show lightAmmo bordered green
// (uncommon), ammo bordered blue (rare), heavyAmmo bordered violet (epic),
// so we mirror that by mapping to tiers 2/3/4 on the shared palette.
const WEAPON_TIER: Record<string, number> = { knife: 1, gun: 2, rifle: 3, sniper: 4, tank: 5, jet: 6 }
const AMMO_TIER: Record<string, number> = { lightAmmo: 2, ammo: 3, heavyAmmo: 4 }

// Flat percentAttack bonus per ammo type, used as the under-tile label so
// ammo's bonus reads in the same shape as armor pieces (e.g. "+10%").
const AMMO_PERCENT_ATTACK: Record<string, number> = { lightAmmo: 10, ammo: 20, heavyAmmo: 40 }

function tierOf(slot: Slot, code: string): number {
  if (slot === 'weapon') {
    return WEAPON_TIER[code] ?? 1
  }
  if (slot === 'ammo') {
    return AMMO_TIER[code] ?? 1
  }
  const m = /(\d+)$/.exec(code)
  return m ? Number(m[1]) : 1
}

// Tailwind ring classes mirror the RARITY_HEX palette. Kept as classes (not
// inline style) so Tailwind's compiler can scope them properly; the matching
// hex is imported from lib/gear/rarity for the inline-style consumers
// (durability fill, bonus text, score pill).
const RARITY_RING = [
  'ring-1 ring-neutral-50/15',
  'ring-1 ring-emerald-400/40',
  'ring-1 ring-blue-400/40',
  'ring-1 ring-violet-400/50',
  'ring-1 ring-amber-400/50',
  'ring-1 ring-red-400/60',
]

function rarityRing(t: number): string {
  return RARITY_RING[Math.max(0, Math.min(5, t - 1))]
}

// Base icon filename. Armor pieces of all 6 tiers share one icon per
// usage category (helmet1..6 → helmet.png); weapons and ammo use the code
// itself. Skin overrides are intentionally not applied here.
function iconUrl(slot: Slot, code: string): string {
  const filename = slot === 'helmet' || slot === 'chest' || slot === 'pants' || slot === 'gloves' || slot === 'boots'
    ? slot
    : code
  return `https://app.warera.io/images/items/${filename}.png`
}

// Pull the surfacing skill + value off a piece. Each piece really has one
// dominant bonus (helmet → criticalDamages, chest → armor, etc.). Weapons
// have two (attack, criticalChance); we surface attack as primary.
interface SkillsBag {
  attack?: number
  criticalChance?: number
  criticalDamages?: number
  armor?: number
  dodge?: number
  precision?: number
}

function primarySkill(skills: SkillsBag | undefined): { skill: string, value: number } | null {
  if (!skills) {
    return null
  }
  if (skills.attack != null) {
    return { skill: 'attack', value: skills.attack }
  }
  for (const k of ['criticalDamages', 'armor', 'dodge', 'precision', 'criticalChance'] as const) {
    if (skills[k] != null) {
      return { skill: k, value: skills[k] as number }
    }
  }
  return null
}

// Lucide-style trousers SVG (lucide has no pants icon). Two visually
// separate rectangular legs joined by a thin waistband, designed to read
// at 14px in the empty-slot placeholder.
function PantsIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <line x1="4" y1="5" x2="20" y2="5" />
      <rect x="4" y="5" width="7" height="16" rx="1" />
      <rect x="13" y="5" width="7" height="16" rx="1" />
    </svg>
  )
}

function SlotIcon({ slot, className }: { slot: Slot, className?: string }) {
  const cls = className ?? 'size-3.5'
  if (slot === 'weapon') {
    return <Sword className={cls} />
  }
  if (slot === 'ammo') {
    return <Target className={cls} />
  }
  if (slot === 'helmet') {
    return <HardHat className={cls} />
  }
  if (slot === 'chest') {
    return <Shield className={cls} />
  }
  if (slot === 'gloves') {
    return <Hand className={cls} />
  }
  if (slot === 'pants') {
    return <PantsIcon className={cls} />
  }
  return <Footprints className={cls} />
}

interface Props {
  equipment: Equipment | undefined
  className?: string
}

/**
 * Compact 7-tile horizontal strip showing a user's currently-equipped gear.
 * Each tile is rarity-ringed, with a thin durability bar along the bottom
 * edge and the piece's primary stat bonus (rarity-colored text) beneath.
 *
 * Slot order matches the in-game tooltip: weapon · ammo · head · chest ·
 * gloves · pants · shoes. Empty slots render a dimmed silhouette so the
 * footprint stays stable regardless of what's equipped.
 *
 * Item icons come from `app.warera.io/images/items/<slot|code>.png`; skin
 * overrides from `equippedSkinKeys` are not applied here.
 */
export function GearStrip({ equipment, className }: Props) {
  const g = equipment ?? {}
  return (
    <div className={cn('flex items-end gap-1.5', className)}>
      {SLOT_ORDER.map((slot) => {
        const v = g[slot]
        if (!v) {
          return (
            <div key={slot} className="flex w-9 flex-col items-center gap-0.5">
              <div className="text-foreground/20 flex size-9 items-center justify-center rounded-md bg-white/[0.03]">
                <SlotIcon slot={slot} />
              </div>
              <span className="h-3" />
            </div>
          )
        }

        const code = typeof v === 'string' ? v : v.code
        const t = tierOf(slot, code)
        const dur = typeof v === 'string' ? 100 : Math.round((v.state / v.maxState) * 100)
        // Ammo is a flat string code with no per-piece skills, so we look its
        // bonus up (+10%/+20%/+40%) instead of pulling it from a roll.
        const bonus = typeof v === 'string'
          ? `+${AMMO_PERCENT_ATTACK[v] ?? 0}%`
          : primarySkill(v.skills as SkillsBag)
        const rgb = rarityHex(t)

        return (
          <div key={slot} className="flex w-9 flex-col items-center gap-0.5">
            <div className={cn('relative flex size-9 items-center justify-center overflow-hidden rounded-md bg-white/5', rarityRing(t))}>
              <Image src={iconUrl(slot, code)} alt={code} width={28} height={28} className="size-7 object-contain" unoptimized />
              <div className="absolute inset-x-0.5 bottom-0.5 h-0.5 overflow-hidden rounded-sm bg-black/40">
                <div className="h-full rounded-sm" style={{ width: `${dur}%`, background: rgb }} />
              </div>
            </div>
            <span className="h-3 text-[9px] font-medium leading-none tabular-nums" style={{ color: rgb }}>
              {typeof bonus === 'string' ? bonus : bonus ? `+${bonus.value}` : ''}
            </span>
          </div>
        )
      })}
    </div>
  )
}
