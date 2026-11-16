'use client'

import type { ReactNode } from 'react'
import type { UserRow } from '@/lib/rows'

import Link from 'next/link'

import { Avatar } from '@/components/avatar'
import { UserNameCell } from '@/components/cells/user-name-cell'
import { SectionHeading } from '@/components/detail/section-heading'
import { READINESS_COLOR } from '@/components/readiness-pill-colors'
import { UserHoverCard } from '@/components/user-hover-card'
import { formatCompact } from '@/lib/format'

export type SquadMember = Pick<
  UserRow,
  'id' | 'username' | 'avatarUrl' | 'colorScheme' | 'level' | 'damage' | 'wealth' | 'health' | 'readinessStatus'
>

const LABEL = [
  'bg-card/80 pointer-events-none absolute top-full left-1/2 mt-1 -translate-x-1/2',
  'rounded px-1 text-[11px] leading-tight whitespace-nowrap',
].join(' ')

/**
 * Members with this little health need food before they can fight.
 */
const LOW_HEALTH = 40

/**
 * Each member placed by level and damage, so who carries the MU and who
 * isn't fighting read at a glance; readiness rings and wealth sizes the dot.
 */
export function SquadMap({ members }: { members: SquadMember[] }) {
  const placed = members.filter((m): m is SquadMember & { level: number } => m.level != null)
  if (placed.length < 2) {
    return null
  }

  const attention = members
    .filter(m => m.readinessStatus === 'debuff' || (m.health != null && m.health < LOW_HEALTH))
    .sort((a, b) => (a.health ?? 100) - (b.health ?? 100))
    .slice(0, 5)

  const laggards = lowDamageForLevel(placed)

  return (
    <section className="bg-card grid gap-6 rounded-md border p-4 sm:p-5 md:grid-cols-[minmax(0,1fr)_15rem]">
      <div className="min-w-0">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-medium">Squad map</h2>
          <span className="text-muted-foreground flex flex-wrap gap-3 text-xs">
            <Swatch color={READINESS_COLOR.buff}>buff</Swatch>
            <Swatch color={READINESS_COLOR.neither}>ready</Swatch>
            <Swatch color={READINESS_COLOR.debuff}>debuff</Swatch>
            <span>size = wealth</span>
          </span>
        </div>
        <Plot members={placed} />
      </div>

      <div className="flex flex-col gap-4 md:border-l md:pl-6">
        <div className="space-y-2">
          <SectionHeading title="Needs attention" />
          {attention.length === 0
            ? <p className="text-muted-foreground text-sm">Everyone is fit to fight.</p>
            : attention.map(m => <Who key={m.id} m={m} note={attentionNote(m)} />)}
        </div>
        {laggards.length > 0 && (
          <div className="space-y-2 border-t pt-4">
            <SectionHeading title="Low damage for level" />
            {laggards.map(m => (
              <Who key={m.id} m={m} note={`Lv ${m.level} · ${formatCompact(m.damage ?? 0)}`} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

/**
 * Log scale for damage, which spans orders of magnitude within one MU.
 */
function Plot({ members }: { members: (SquadMember & { level: number })[] }) {
  const levels = members.map(m => m.level)
  const minLvl = Math.min(...levels) - 1
  const maxLvl = Math.max(...levels) + 1
  const hits = members.map(m => m.damage ?? 0).filter(d => d > 0)
  const lo = Math.floor(Math.log10(Math.min(...hits, 1e6)))
  const hi = Math.ceil(Math.log10(Math.max(...hits, 10 ** (lo + 1))))
  const maxWealth = Math.max(...members.map(m => m.wealth ?? 0), 1)

  const x = (lvl: number) => ((lvl - minLvl) / (maxLvl - minLvl)) * 100
  // No damage sits on the floor rather than off the chart.
  const y = (dmg: number | null) => 100 - ((Math.log10(Math.max(dmg ?? 0, 10 ** lo)) - lo) / (hi - lo)) * 100
  const size = (w: number | null) => Math.round(18 + 22 * Math.sqrt((w ?? 0) / maxWealth))

  const yTicks = range(lo, hi).flatMap(p => [10 ** p, 3 * 10 ** p]).filter(t => t <= 10 ** hi)
  const step = Math.max(1, Math.ceil((maxLvl - minLvl) / 6))
  const xTicks = range(Math.ceil(minLvl / step) * step, maxLvl, step)
  const labelled = new Set([...members].sort((a, b) => (b.damage ?? 0) - (a.damage ?? 0)).slice(0, 3).map(m => m.id))

  return (
    <div className="relative mb-6 ml-10 h-72 border-b border-l">
      {/* Inset so the largest avatars at the extremes stay inside the frame. */}
      <div className="absolute inset-x-6 inset-y-5">
        {yTicks.map(t => (
          <div key={t}>
            <div className="bg-border/50 absolute -inset-x-6 h-px" style={{ top: `${y(t)}%` }} />
            <span
              className="text-muted-foreground absolute -left-16 w-8 -translate-y-1/2 text-right text-[10px] tabular-nums"
              style={{ top: `${y(t)}%` }}
            >
              {formatCompact(t)}
            </span>
          </div>
        ))}
        {xTicks.map(l => (
          <span
            key={l}
            className="text-muted-foreground absolute -bottom-10 -translate-x-1/2 text-[10px] whitespace-nowrap tabular-nums"
            style={{ left: `${x(l)}%` }}
          >
            Lv {l}
          </span>
        ))}
        {/* Biggest first, so small dots stay clickable on top. */}
        {[...members].sort((a, b) => (b.wealth ?? 0) - (a.wealth ?? 0)).map(m => (
          <div
            key={m.id}
            className="absolute w-max -translate-x-1/2 -translate-y-1/2 hover:z-10"
            style={{ left: `${x(m.level)}%`, top: `${y(m.damage)}%` }}
          >
            <UserHoverCard userId={m.id}>
              <Link href={`/users/${m.id}`} className="block rounded-full max-sm:scale-75" aria-label={m.username}>
                <Avatar src={m.avatarUrl} name={m.username} size={size(m.wealth)} style={ring(m, 2)} />
              </Link>
            </UserHoverCard>
            {labelled.has(m.id) && (
              <span className={LABEL}>
                {m.username}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Members furthest below the damage their level predicts, from a straight-line
 * fit of log damage on level across the MU. Needs a handful of fighters to mean anything.
 */
function lowDamageForLevel(members: (SquadMember & { level: number })[]) {
  const pts = members.map(m => ({ m, lx: m.level, ly: Math.log10(Math.max(m.damage ?? 0, 1)) }))
  if (pts.filter(p => p.ly > 0).length < 5) {
    return []
  }

  const mx = mean(pts.map(p => p.lx))
  const my = mean(pts.map(p => p.ly))
  const sxx = pts.reduce((s, p) => s + (p.lx - mx) ** 2, 0)
  const slope = sxx > 0 ? pts.reduce((s, p) => s + (p.lx - mx) * (p.ly - my), 0) / sxx : 0

  // Under half the expected damage (log10 2 ≈ 0.3) before anyone is called out.
  return pts
    .map(p => ({ m: p.m, gap: p.ly - (my + slope * (p.lx - mx)) }))
    .filter(r => r.gap < -0.3)
    .sort((a, b) => a.gap - b.gap)
    .slice(0, 3)
    .map(r => r.m)
}

function attentionNote(m: SquadMember): string {
  const hp = m.health != null ? `${m.health}% health` : null

  return m.readinessStatus === 'debuff' ? ['debuff', hp].filter(Boolean).join(' · ') : (hp ?? '')
}

function Who({ m, note }: { m: SquadMember, note: string }) {
  return (
    <div className="flex items-center justify-between gap-2 text-sm">
      <UserHoverCard userId={m.id}>
        <UserNameCell userId={m.id} name={m.username} avatarUrl={m.avatarUrl} colorScheme={m.colorScheme} />
      </UserHoverCard>
      <span className="text-muted-foreground shrink-0 text-xs tabular-nums">{note}</span>
    </div>
  )
}

function Swatch({ color, children }: { color: string, children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="size-2 rounded-full" style={{ background: color }} />
      {children}
    </span>
  )
}

function ring(m: SquadMember, width: number) {
  const color = m.readinessStatus ? READINESS_COLOR[m.readinessStatus] : 'var(--border)'

  return { boxShadow: `0 0 0 2px var(--card), 0 0 0 ${2 + width}px ${color}` }
}

function mean(xs: number[]): number {
  return xs.reduce((a, b) => a + b, 0) / xs.length
}

function range(from: number, to: number, step = 1): number[] {
  const out: number[] = []
  for (let v = from; v <= to; v += step) {
    out.push(v)
  }

  return out
}
