import type { GearLookup } from '@/lib/gear/score'
import type { Equipment } from '@/lib/warera/api'

import { Footprints, Hand, HardHat, Shield, Sword, Target } from 'lucide-react'
import Image from 'next/image'

import { rarityColor } from '@/lib/gear/rarity'
import { tierOfCode } from '@/lib/gear/score'
import { cn } from '@/lib/utils'
import { itemIconUrl } from '@/lib/warera/urls'

/**
 * Slot order mirrors the in-game UI (weapon, ammo, head, chest, gloves,
 * pants, shoes). Layout downstream depends on this order; do not reshuffle.
 */
const SLOT_ORDER = ['weapon', 'ammo', 'helmet', 'chest', 'gloves', 'pants', 'boots'] as const
type Slot = (typeof SLOT_ORDER)[number]

/**
 * 'dark' is the hover card, dark in both themes; 'card' is a theme-aware
 * detail card, where white-alpha tiles would vanish in light mode.
 */
type Surface = 'dark' | 'card'

/**
 * Ring classes matching the rarity colours. Classes rather than inline styles so
 * Tailwind generates them.
 */
const RARITY_RING = [
  'ring-1 ring-neutral-50/15',
  'ring-1 ring-heat-green/40',
  'ring-1 ring-blue-400/40',
  'ring-1 ring-violet-400/50',
  'ring-1 ring-amber-400/50',
  'ring-1 ring-red-400/60',
]

function rarityRing(t: number, surface: Surface): string {
  const i = Math.max(0, Math.min(5, t - 1))
  if (i === 0 && surface === 'card') {
    return 'ring-1 ring-border'
  }

  return RARITY_RING[i]
}

/**
 * Base icon filename. Armor pieces of all 6 tiers share one icon per
 * usage category (helmet1..6 → helmet.webp); weapons and ammo use the code
 * itself. Skin overrides are not applied here.
 */
function iconUrl(slot: Slot, code: string): string {
  const filename = slot === 'helmet' || slot === 'chest' || slot === 'pants' || slot === 'gloves' || slot === 'boots'
    ? slot
    : code

  return itemIconUrl(filename)
}

/**
 * Pull the surfacing skill + value off a piece. Each piece really has one
 * dominant bonus (helmet → criticalDamages, chest → armor, etc.). Weapons
 * have two (attack, criticalChance); we surface attack as primary.
 */
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

/**
 * Lucide-style trousers SVG (lucide has no pants icon). Two visually
 * separate rectangular legs joined by a thin waistband, designed to read
 * at 14px in the empty-slot placeholder.
 */
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

  /**
   * The code→tier + ammo-bonus lookup derived from the live config (Snapshot
   * .gearLookup). Server pages read it from getSnapshot(); the client hover-card
   * gets it in the /api/users/[id] payload.
   */
  gearLookup: GearLookup
  className?: string

  /**
   * The backdrop this strip sits on; see {@link Surface}. Defaults to 'dark'
   * (the hover-card tooltip). The detail page passes 'card' so tiles stay
   * visible on a light theme.
   */
  surface?: Surface
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
 * Item icons come from `media.warera.io/images/itemsv2/<slot|code>.webp`; skin
 * overrides from `equippedSkinKeys` are not applied here.
 */
export function GearStrip({ equipment, gearLookup, className, surface = 'dark' }: Props) {
  const g = equipment ?? {}
  const tileBg = surface === 'card' ? 'bg-muted' : 'bg-white/5'
  const emptyBg = surface === 'card' ? 'bg-muted/50' : 'bg-white/[0.03]'
  const emptyIcon = surface === 'card' ? 'text-muted-foreground/40' : 'text-foreground/20'
  // The card adds a score tile, so eight tiles must fit a phone: smaller tiles
  // and gaps below sm. The tooltip has a fixed width, so it never shrinks.
  const rowGap = surface === 'card' ? 'gap-1 sm:gap-1.5' : 'gap-1.5'
  const tileW = surface === 'card' ? 'w-8 sm:w-9' : 'w-9'
  const tileSize = surface === 'card' ? 'size-8 sm:size-9' : 'size-9'
  const imgSize = surface === 'card' ? 'size-6 sm:size-7' : 'size-7'

  return (
    <div className={cn('flex items-end', rowGap, className)}>
      {SLOT_ORDER.map((slot) => {
        const v = g[slot]
        if (!v) {
          return (
            <div key={slot} className={cn('flex flex-col items-center gap-0.5', tileW)}>
              <div className={cn('flex items-center justify-center rounded-md', tileSize, emptyBg, emptyIcon)}>
                <SlotIcon slot={slot} />
              </div>
              <span className="h-3" />
            </div>
          )
        }

        const code = typeof v === 'string' ? v : v.code
        const t = tierOfCode(code, gearLookup)
        const dur = typeof v === 'string' ? 100 : Math.round((v.state / v.maxState) * 100)
        // Ammo is a flat string code with no per-piece skills, so we look its
        // bonus up (+10%/+20%/+40%) from the gear lookup instead of a roll.
        const bonus = typeof v === 'string'
          ? `+${gearLookup.ammoBonusByCode[v] ?? 0}%`
          : primarySkill(v.skills as SkillsBag)

        const color = rarityColor(t)

        return (
          <div key={slot} className={cn('flex flex-col items-center gap-0.5', tileW)}>
            <div
              className={cn(
                'relative flex items-center justify-center overflow-hidden rounded-md',
                tileSize,
                tileBg,
                rarityRing(t, surface),
              )}
            >
              <Image
                src={iconUrl(slot, code)}
                alt={code}
                width={28}
                height={28}
                className={cn('object-contain', imgSize)}
                unoptimized
              />
              <div className="absolute inset-x-0.5 bottom-0.5 h-0.5 overflow-hidden rounded-sm bg-black/40">
                <div className="h-full rounded-sm" style={{ width: `${dur}%`, background: color }} />
              </div>
            </div>
            <span className="h-3 text-[9px] font-medium leading-none tabular-nums" style={{ color }}>
              {typeof bonus === 'string' ? bonus : bonus ? `+${bonus.value}` : ''}
            </span>
          </div>
        )
      })}
    </div>
  )
}
