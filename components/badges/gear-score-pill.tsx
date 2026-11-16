import { rarityColor, rarityTint as tint } from '@/lib/gear/rarity'
import { gearScoreTier } from '@/lib/gear/score'

interface Props {
  /**
   * 0-100 gear score, or null when the user hasn't been hydrated with
   * equipment yet (renders nothing).
   */
  score: number | null | undefined

  /**
   * Rarity tier (1-6) from the actual equipped items, so the pill color matches
   * the gear tiles. When omitted (e.g. the MU/country tables, which show an
   * average score with no equipment) it falls back to the score-derived band.
   */
  tier?: number | null
}

/**
 * The 0-100 gear score, tinted by its rarity tier.
 */
export function GearScorePill({ score, tier }: Props) {
  if (score == null) {
    return null
  }

  const color = rarityColor(tier ?? gearScoreTier(score))

  return (
    <span
      className="rounded-md px-2 py-0.5 text-[12px] font-medium leading-tight tabular-nums"
      style={{ background: tint(color, 13), color, boxShadow: `inset 0 0 0 1px ${tint(color, 33)}` }}
    >
      {score}
      <span className="text-[10px] opacity-70">/100</span>
    </span>
  )
}
