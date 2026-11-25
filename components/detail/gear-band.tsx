import type { GearLookup } from '@/lib/gear/score'
import type { Equipment } from '@/lib/warera/api'

import { tint } from '@/components/colors'
import { GearStrip } from '@/components/detail/gear-strip'
import { rarityColor, rarityLabel } from '@/lib/gear/rarity'
import { computeGearTier, gearScoreTier } from '@/lib/gear/score'
import { cn } from '@/lib/utils'

interface Props {
  score: number | null | undefined
  equipment: Equipment | undefined

  /**
   * Code→tier lookup from the live config (Snapshot.gearLookup), threaded to the
   * tier readout and the strip so both resolve rarities from scraped data.
   */
  gearLookup: GearLookup
}

/**
 * The gear score tile followed by the seven equipped slots, for the profile
 * sidebar.
 */
export function GearBand({ score, equipment, gearLookup }: Props) {
  // Prefer the real item tiers so the score tile matches the gear strip's
  // rarity rings; fall back to the score band only if equipment is missing.
  const tier = computeGearTier(equipment, gearLookup) ?? gearScoreTier(score)
  const color = rarityColor(tier)

  return (
    <div className="flex items-end gap-1 sm:gap-2">
      {/* Score tile matches GearStrip's card-surface tile footprint (32px on
          mobile, 36px from sm up) so it reads as the head of the strip. */}
      <div className="flex w-8 flex-col items-center gap-0.5 sm:w-9">
        <div
          className={cn('flex size-8 flex-col items-center justify-center rounded-md sm:size-9')}
          style={{ background: tint(color, 13), boxShadow: `inset 0 0 0 1px ${tint(color, 33)}` }}
        >
          <span className="text-xs font-semibold leading-none tabular-nums sm:text-sm" style={{ color }}>
            {score ?? 0}
          </span>
          <span className="text-muted-foreground text-[7px] leading-none">/100</span>
        </div>
        <span className="h-3 text-[9px] font-medium leading-none" style={{ color }}>{rarityLabel(tier)}</span>
      </div>
      <GearStrip equipment={equipment} gearLookup={gearLookup} surface="card" />
    </div>
  )
}
