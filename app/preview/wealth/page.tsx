'use client'

import type { Range } from '@/lib/query'

import { useState } from 'react'

import { HeatCell } from '@/components/data-table/heat-cell'
import { cn } from '@/lib/utils'

/**
 * Throwaway design sandbox for the wealth-component breakdown. WarEra reports a
 * player's wealth as a sum of five parts (Companies, Items, Cash, Equipment,
 * Weapons; from `stats.wealth`). For an MU or country there's no native
 * breakdown, so theirs is the sum of members'/citizens' parts.
 *
 * Chosen direction: a single "Wealth composition" card, used identically for a
 * player, an MU, and a country. Each part is one row (label, value, leaderboard
 * rank) with the value heat-tinted (green = strong vs the field, red = weak),
 * the same treatment every other Economy stat already uses. No bars. Groups also
 * show a per-capita average.
 *
 * Local sample data only. Promote to a real component in a follow-up; this route
 * is disposable. (Here the value tint is driven by rank as a stand-in; the real
 * card will tint by the value's dataset range, like the existing wealth rows.)
 */

// ---------------------------------------------------------------------------
// Data model
// ---------------------------------------------------------------------------

type CompKey = 'companies' | 'items' | 'money' | 'equipments' | 'weapons'

interface CompMeta {
  key: CompKey
  label: string
}

const COMPONENTS: CompMeta[] = [
  { key: 'companies', label: 'Companies' },
  { key: 'items', label: 'Items' },
  { key: 'money', label: 'Cash' },
  { key: 'equipments', label: 'Equipment' },
  { key: 'weapons', label: 'Weapons' },
]

interface Subject {
  id: string
  kind: 'user' | 'mu' | 'country'
  name: string
  wealth: Record<CompKey, number>
  // Per-component leaderboard rank (0 = unranked, omitted from the UI).
  ranks: Record<CompKey, number>
  rankOf: number
  // Members (MU) or citizens (country), for a per-capita average. Absent for a user.
  count?: number
}

const SUBJECTS: Subject[] = [
  {
    id: 'typical',
    kind: 'user',
    name: 'Typical player',
    wealth: { companies: 80, items: 217, money: 18.5, equipments: 7.7, weapons: 0 },
    ranks: { companies: 5400, items: 3100, money: 8900, equipments: 12_000, weapons: 0 },
    rankOf: 16_065,
  },
  {
    id: 'whale',
    kind: 'user',
    name: 'Whale player',
    wealth: { companies: 1_240_000, items: 320_000, money: 95_000, equipments: 180_000, weapons: 240_000 },
    ranks: { companies: 3, items: 42, money: 11, equipments: 7, weapons: 2 },
    rankOf: 16_065,
  },
  {
    id: 'mu',
    kind: 'mu',
    name: 'Iron Legion (MU)',
    wealth: { companies: 4_100_000, items: 6_800_000, money: 920_000, equipments: 410_000, weapons: 120_000 },
    ranks: { companies: 22, items: 9, money: 31, equipments: 18, weapons: 44 },
    rankOf: 1041,
    count: 42,
  },
  {
    id: 'country',
    kind: 'country',
    name: 'Poland (country)',
    wealth: { companies: 88_000_000, items: 142_000_000, money: 19_000_000, equipments: 9_000_000, weapons: 3_400_000 },
    ranks: { companies: 6, items: 3, money: 9, equipments: 12, weapons: 15 },
    rankOf: 180,
    count: 1530,
  },
  {
    id: 'edge',
    kind: 'user',
    name: 'Single-asset player',
    wealth: { companies: 0, items: 5_200_000, money: 0, equipments: 0, weapons: 0 },
    ranks: { companies: 0, items: 120, money: 0, equipments: 0, weapons: 0 },
    rankOf: 16_065,
  },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function totalOf(w: Record<CompKey, number>): number {
  return COMPONENTS.reduce((sum, c) => sum + w[c.key], 0)
}

function fmt(value: number): string {
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(1)}B`
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`
  }
  return Math.round(value).toLocaleString()
}

// ---------------------------------------------------------------------------
// The chosen card
// ---------------------------------------------------------------------------

function WealthComposition({ subject }: { subject: Subject }) {
  const w = subject.wealth
  const total = totalOf(w)
  const who = subject.kind === 'mu' ? 'member' : 'citizen'
  const caption = subject.count ? `${fmt(total / subject.count)} avg / ${who}` : null
  // Stand-in heat: tint the value by leaderboard rank (lower rank = greener),
  // reusing the real HeatCell 'invert' mode. The shipped card will tint by the
  // value's own dataset range instead.
  const rankRange: Range = [1, subject.rankOf, Math.round((1 + subject.rankOf) / 2)]

  return (
    <div className="bg-card flex max-w-xs flex-col gap-2 rounded-md border p-3">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs font-medium">Wealth composition</span>
        <span className="text-sm tabular-nums">{fmt(total)}</span>
      </div>
      {caption && <span className="text-muted-foreground -mt-1 text-xs">{caption}</span>}
      <dl className="mt-0.5 space-y-0.5 text-sm">
        {COMPONENTS.map((c) => {
          const value = w[c.key]
          const rank = subject.ranks[c.key]
          return (
            <div key={c.key} className="flex items-baseline justify-between gap-2">
              <dt className="text-muted-foreground">{c.label}</dt>
              <dd className="flex items-baseline gap-2 tabular-nums">
                {rank > 0
                  ? (
                      <HeatCell value={rank} range={rankRange} mode="invert">{fmt(value)}</HeatCell>
                    )
                  : (
                      <span>{fmt(value)}</span>
                    )}
                <span className="text-muted-foreground/60 w-14 text-right text-xs">
                  {rank > 0 ? `#${rank.toLocaleString()}` : ''}
                </span>
              </dd>
            </div>
          )
        })}
      </dl>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function WealthPreviewPage() {
  const [subjectId, setSubjectId] = useState<string>('mu')
  const subject = SUBJECTS.find(s => s.id === subjectId) ?? SUBJECTS[0]

  const trio = ['whale', 'mu', 'country']
    .map(id => SUBJECTS.find(s => s.id === id))
    .filter((s): s is Subject => Boolean(s))

  return (
    <main className="mx-auto max-w-5xl space-y-8 px-6 py-10">
      <header className="space-y-3">
        <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">Design sandbox</p>
        <h1 className="text-2xl font-bold">Wealth composition</h1>
        <p className="text-muted-foreground max-w-2xl text-sm">
          One card, used identically for a player, an MU, and a country. Each wealth part is a plain row: label, value,
          and its leaderboard rank. The value is heat-tinted (green = strong vs the field, red = weak), the same
          treatment the other Economy stats use. Groups also show a per-capita average. Sample data only.
        </p>
        <div className="bg-muted inline-flex flex-wrap rounded-md p-0.5 text-sm">
          {SUBJECTS.map(s => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSubjectId(s.id)}
              className={cn(
                'rounded px-3 py-1 transition-colors',
                subject.id === s.id ? 'bg-card font-medium shadow-sm' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {s.name}
            </button>
          ))}
        </div>
      </header>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">{subject.name}</h2>
        <div className="bg-muted/30 rounded-xl p-4">
          <WealthComposition subject={subject} />
        </div>
      </section>

      <section className="space-y-3 border-t pt-8">
        <h2 className="text-base font-semibold">Side by side: player vs MU vs country</h2>
        <p className="text-muted-foreground text-sm">The same card across all three entity types.</p>
        <div className="bg-muted/30 grid gap-4 rounded-xl p-4 sm:grid-cols-3">
          {trio.map(s => (
            <div key={s.id} className="space-y-2">
              <span className="text-muted-foreground text-[10px] tracking-wide uppercase">{s.name}</span>
              <WealthComposition subject={s} />
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
