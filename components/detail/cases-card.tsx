import type { CaseRarity, CasesBreakdown } from '@/lib/warera/api'

import { EmptyDash } from '@/components/empty-dash'
import { cn } from '@/lib/utils'
import { CASE_RARITIES } from '@/lib/warera/api'

// Rarity accents reuse the shared heat tokens so the dots match the rest of the
// app's palette; common stays muted since it's the floor.
const RARITY_COLOR: Record<CaseRarity, string> = {
  common: 'var(--muted-foreground)',
  uncommon: 'var(--heat-green)',
  rare: 'var(--heat-blue)',
  epic: 'var(--heat-purple)',
  legendary: 'var(--heat-gold)',
  mythic: 'var(--heat-red)',
}

interface Props {
  // Headline count + leaderboard position, from the snapshot row.
  total: number | null
  rank?: number | null
  rankOf?: number
  // Per-rarity split fetched on demand; null when unavailable.
  breakdown: CasesBreakdown | null
}

/**
 * Cases opened, with a per-rarity breakdown of the loot pulled (common…mythic),
 * summed across both case types. Mirrors MultiStatCard's hero + rows layout so
 * it sits flush with the other detail cards.
 */
export function CasesCard({ total, rank, rankOf, breakdown }: Props) {
  return (
    <div className="bg-card flex flex-col gap-2 rounded-md border p-3">
      <span className="text-xs font-medium">Cases opened</span>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-2xl tabular-nums">
          {total == null ? <EmptyDash /> : total.toLocaleString()}
        </span>
        {rank != null && total != null && rankOf != null && (
          <span className="text-muted-foreground/60 text-xs tabular-nums">
            #
            {rank.toLocaleString()}
            {' of '}
            {rankOf.toLocaleString()}
          </span>
        )}
      </div>
      {breakdown && (
        <dl className="space-y-0.5">
          {CASE_RARITIES.map((rarity) => {
            const count = breakdown.byRarity[rarity] ?? 0
            const pct = breakdown.total > 0 ? Math.round((count / breakdown.total) * 100) : 0
            // Keep the full ladder visible but dim tiers with nothing pulled yet,
            // so the rarities the player has actually opened still stand out.
            return (
              <div key={rarity} className={cn('flex items-baseline justify-between gap-2 text-sm', count === 0 && 'opacity-40')}>
                <dt className="text-muted-foreground flex items-center gap-1.5 capitalize">
                  <span className="size-2 shrink-0 rounded-full" style={{ background: RARITY_COLOR[rarity] }} />
                  {rarity}
                </dt>
                <dd className="flex items-baseline gap-2 tabular-nums">
                  <span>{count.toLocaleString()}</span>
                  <span className="text-muted-foreground/60 w-10 text-right text-xs">
                    {pct}
                    %
                  </span>
                </dd>
              </div>
            )
          })}
        </dl>
      )}
    </div>
  )
}
