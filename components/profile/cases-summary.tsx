'use client'

import type { CaseRarity, CaseRarityCounts, CasesByType } from '@/lib/warera/api'

import { useState } from 'react'

import { EmptyDash } from '@/components/empty-dash'
import { SectionHeading } from '@/components/profile/section-heading'
import { StackedBar } from '@/components/stacked-bar'
import { cn } from '@/lib/utils'
import { CASE_RARITIES } from '@/lib/warera/api'

/**
 * Rarity accents reuse the shared heat tokens so the dots match the rest of the
 * app's palette; common is the neutral grey since it's the floor.
 */
const RARITY_COLOR: Record<CaseRarity, string> = {
  common: 'var(--heat-slate)',
  uncommon: 'var(--heat-green)',
  rare: 'var(--heat-blue)',
  epic: 'var(--heat-purple)',
  legendary: 'var(--heat-gold)',
  mythic: 'var(--heat-red)',
}

interface Props extends CasesByType {
  /**
   * Combined opens (case1 + case2) from the snapshot row; null when no case
   * stats were captured. The per-type opens and rarity maps come from
   * CasesByType; the combined ladder is derived from the two maps.
   */
  combinedOpened: number | null

  /**
   * Leaderboard position on combined opens (shown on the All segment only).
   */
  rank?: number | null
  rankOf?: number
}

type Segment = 'all' | 'standard' | 'mythic'

function sumRarities(r: CaseRarityCounts | null): number {
  return r ? CASE_RARITIES.reduce((t, k) => t + (r[k] ?? 0), 0) : 0
}

/**
 * Merge the two per-type maps into the combined ladder.
 */
function mergeRarities(a: CaseRarityCounts | null, b: CaseRarityCounts | null): CaseRarityCounts {
  const out: CaseRarityCounts = {}
  for (const rarity of CASE_RARITIES) {
    const count = (a?.[rarity] ?? 0) + (b?.[rarity] ?? 0)
    if (count > 0) {
      out[rarity] = count
    }
  }

  return out
}

/**
 * Cases opened for the profile sidebar, with an All / Standard / Mythic toggle
 * and the loot per rarity as one bar. Standard is the daily case (case1),
 * Mythic the premium one (case2).
 */
export function CasesSummary({
  combinedOpened,
  standardOpened,
  mythicOpened,
  standardByRarity,
  mythicByRarity,
  rank,
  rankOf,
}: Props) {
  const [seg, setSeg] = useState<Segment>('all')

  const hasData = combinedOpened != null
  const segments: { key: Segment, label: string, opened: number | null, rarities: CaseRarityCounts | null }[] = [
    { key: 'all', label: 'All', opened: combinedOpened, rarities: mergeRarities(standardByRarity, mythicByRarity) },
    { key: 'standard', label: 'Standard', opened: standardOpened, rarities: standardByRarity },
    { key: 'mythic', label: 'Mythic', opened: mythicOpened, rarities: mythicByRarity },
  ]

  const active = segments.find(s => s.key === seg) ?? segments[0]
  const total = sumRarities(active.rarities)

  return (
    <div className="flex flex-col gap-2">
      <SectionHeading
        title="Cases"
        aside={hasData && (
          <div className="bg-muted/50 flex rounded-md p-0.5 text-xs">
            {segments.map(s => (
              <button
                key={s.key}
                type="button"
                onClick={() => setSeg(s.key)}
                className={cn(
                  'rounded px-2 py-0.5 transition-colors',
                  seg === s.key ? 'bg-card shadow-sm' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        )}
      />

      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span className="text-muted-foreground">Opened</span>
        <span className="tabular-nums">
          {active.opened == null ? <EmptyDash /> : active.opened.toLocaleString()}
          {seg === 'all' && rank != null && combinedOpened != null && rankOf != null && (
            <span className="text-muted-foreground/60 ml-2 text-xs">
              #{rank.toLocaleString()} of {rankOf.toLocaleString()}
            </span>
          )}
        </span>
      </div>

      {hasData && total > 0 && (
        <>
          <StackedBar
            className="bg-muted h-2"
            segments={CASE_RARITIES.map(r => ({ key: r, value: active.rarities?.[r] ?? 0, color: RARITY_COLOR[r] }))}
          />
          <dl className="text-muted-foreground flex flex-wrap gap-x-3 gap-y-0.5 text-xs tabular-nums">
            {CASE_RARITIES.map((rarity) => {
              const count = active.rarities?.[rarity] ?? 0

              // Keep the full ladder visible but dim tiers with nothing pulled
              // yet, so the rarities the player has actually opened stand out.
              return (
                <div key={rarity} className={cn('inline-flex items-center gap-1', count === 0 && 'opacity-40')}>
                  <span className="size-2 shrink-0 rounded-full" style={{ background: RARITY_COLOR[rarity] }} />
                  <dt className="capitalize">{rarity}</dt>
                  <dd className="text-foreground">{count.toLocaleString()}</dd>
                </div>
              )
            })}
          </dl>
        </>
      )}
    </div>
  )
}
