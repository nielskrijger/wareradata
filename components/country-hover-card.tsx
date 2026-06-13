'use client'

import type { ReactNode } from 'react'

import type { HoverStatus } from '@/components/hover-card/use-entity-hover'
import type { CountryDetails } from '@/lib/cache/countries'
import type { Range } from '@/lib/query'

import { Building2, Drumstick, Flame, Heart, Shield, Swords, Trophy, Users } from 'lucide-react'

import { TierBadge } from '@/components/badges/tier-badge'
import { CompactNumber } from '@/components/cells/compact-number'
import { Flag } from '@/components/flag'
import { FillBar } from '@/components/hover-card/fill-bar'
import { HoverCardShell } from '@/components/hover-card/hover-card-shell'
import { useEntityHover } from '@/components/hover-card/use-entity-hover'
import { heatColor } from '@/lib/utils'

interface Props {
  // Country id used as both the fetch key and the route param. When null, the
  // children render bare (no tooltip wrapper).
  countryId: string | null | undefined
  // The trigger element (typically a <CountryCell>'s flag + name). Tooltip
  // opens on hover.
  children: ReactNode
  // Classes for the trigger wrapper span. Defaults to a block flex-item that
  // lets a truncating child shrink (the country-cell case); a flag roster
  // passes `inline-flex` so each trigger sits inline among wrapped flags.
  triggerClassName?: string
}

const intFull = new Intl.NumberFormat('en', { maximumFractionDigits: 0 })

const ICON = 'size-3 text-neutral-50/70'

// Position of a value within its [min, max] range as a 0–100 percent, for the
// heat tint. Clamped so out-of-range values stay in gamut.
function pctInRange(value: number, range: Range | undefined): number {
  if (!range) {
    return 0
  }
  const [min, max] = range
  if (max === min) {
    return 0
  }
  return Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100))
}

/**
 * Wraps a country-name-shaped trigger with a hover tooltip showing the
 * country's leaderboard stats as a tile dashboard (population, weekly damage,
 * wealth, gear, MUs, war mode) over health/hunger bars, each heat-tinted
 * against the dataset ranges. Data is fetched from `/api/countries/[id]` on
 * first open and cached in-process for the rest of the session.
 *
 * When `countryId` is null/undefined the children render bare — there's no
 * entity to look up, so no tooltip is shown.
 */
export function CountryHoverCard({ countryId, children, triggerClassName = 'block min-w-0' }: Props) {
  const { status, data, onOpenChange } = useEntityHover<CountryDetails>(countryId ? `/api/countries/${countryId}` : null)

  return (
    <HoverCardShell
      enabled={!!countryId}
      triggerClassName={triggerClassName}
      contentClassName="w-80 p-0"
      onOpenChange={onOpenChange}
      content={status === 'ready' && data ? <Body data={data} /> : <Placeholder status={status} />}
    >
      {children}
    </HoverCardShell>
  )
}

function Body({ data }: { data: CountryDetails }) {
  const { country: c, ranges } = data
  const war = c.avgWarShare != null ? Math.round(c.avgWarShare * 100) : null
  return (
    <>
      <div className="flex items-center gap-2 px-3 py-2">
        <Flag code={c.code} className="h-4 w-6" />
        <span className="min-w-0 truncate font-medium">{c.name}</span>
        {c.damageTier && <TierBadge tier={c.damageTier} />}
      </div>

      <div className="grid grid-cols-3 gap-1.5 px-3 pb-2">
        <Tile icon={<Users className={ICON} />} label="Population" value={c.activePopulation} rank={c.activePopulationRank} range={ranges.activePopulation} />
        <Tile icon={<Swords className={ICON} />} label="Weekly" value={c.weeklyDamage} rank={c.weeklyDamageRank} range={ranges.weeklyDamage} display={<CompactNumber value={c.weeklyDamage} />} />
        <Tile icon={<Trophy className={ICON} />} label="Wealth" value={c.citizenWealth} rank={c.citizenWealthRank} range={ranges.citizenWealth} display={<CompactNumber value={c.citizenWealth} />} />
        <Tile icon={<Shield className={ICON} />} label="Gear" value={c.avgGearScore} rank={c.avgGearScoreRank} range={ranges.avgGearScore} />
        <Tile icon={<Building2 className={ICON} />} label="MUs" value={c.musCount} rank={c.musCountRank} range={ranges.musCount} />
        <Tile icon={<Flame className={ICON} />} label="War" value={c.avgWarShare} rank={c.avgWarShareRank} range={ranges.avgWarShare} display={war != null ? `${war}%` : undefined} />
      </div>

      <div className="space-y-1 border-t border-neutral-50/15 px-3 py-2">
        <FillBar icon={<Heart className={ICON} />} pct={c.avgHealth} />
        <FillBar icon={<Drumstick className={ICON} />} pct={c.avgHunger} />
      </div>
    </>
  )
}

interface TileProps {
  icon: ReactNode
  label: string
  // The raw value, used for the heat tint against `range`.
  value: number | null
  rank: number | null
  range: Range | undefined
  // Overrides the displayed text (e.g. a CompactNumber or a "%" suffix). Falls
  // back to the integer-formatted value.
  display?: ReactNode
}

function Tile({ icon, label, value, rank, range, display }: TileProps) {
  const color = value != null ? heatColor(pctInRange(value, range)) : undefined
  return (
    <div className="overflow-hidden rounded-md bg-white/5 px-2 py-1.5">
      <div className="flex items-center gap-1 whitespace-nowrap text-[10px] uppercase tracking-wide text-neutral-50/50">
        {icon}
        {label}
      </div>
      <div className="mt-0.5 whitespace-nowrap text-sm font-semibold tabular-nums" style={{ color }}>
        {value == null ? <span className="text-neutral-50/40">—</span> : (display ?? intFull.format(value))}
        {value != null && rank != null && <span className="ml-1 text-[10px] font-normal text-neutral-50/40">{`#${rank}`}</span>}
      </div>
    </div>
  )
}

// Fixed-size placeholder matching the loaded layout's footprint so the popover
// doesn't jump when data arrives. Loading uses subtle pulses; error swaps in a
// one-line message.
function Placeholder({ status }: { status: HoverStatus }) {
  if (status === 'error') {
    return (
      <div className="px-3 py-2 text-[11px] text-neutral-50/70">
        Couldn't load details.
      </div>
    )
  }

  return (
    <div className="animate-pulse">
      <div className="flex items-center gap-2 px-3 py-2">
        <span className="h-3 w-6 rounded bg-white/10" />
        <span className="h-3 w-24 rounded bg-white/10" />
      </div>
      <div className="grid grid-cols-3 gap-1.5 px-3 pb-2">
        {Array.from({ length: 6 }).map((_, i) => (
          // eslint-disable-next-line react/no-array-index-key -- 6 fixed slots
          <div key={i} className="h-11 rounded-md bg-white/10" />
        ))}
      </div>
      <div className="space-y-2 border-t border-neutral-50/15 px-3 py-3">
        <span className="block h-1.5 rounded bg-white/10" />
        <span className="block h-1.5 rounded bg-white/10" />
      </div>
    </div>
  )
}
