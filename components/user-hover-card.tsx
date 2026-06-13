'use client'

import type { ReactNode } from 'react'

import type { HoverStatus } from '@/components/hover-card/use-entity-hover'
import type { GearLookup } from '@/lib/gear/score'
import type { Range } from '@/lib/query'
import type { UserRow } from '@/lib/rows'
import type { Equipment } from '@/lib/warera/api'

import { Clock, Coins, Drumstick, Heart, Swords, Trophy } from 'lucide-react'

import { Avatar } from '@/components/avatar'
import { GearScorePill } from '@/components/badges/gear-score-pill'
import { ReadinessBadge } from '@/components/badges/readiness-badge'
import { HeatCell } from '@/components/data-table/heat-cell'
import { GearStrip } from '@/components/detail/gear-strip'
import { Flag } from '@/components/flag'
import { FillBar } from '@/components/hover-card/fill-bar'
import { HoverCardShell } from '@/components/hover-card/hover-card-shell'
import { useEntityHover } from '@/components/hover-card/use-entity-hover'
import { formatRelativeTime } from '@/lib/format'
import { computeGearTier } from '@/lib/gear/score'

interface Props {
  // User id used as both the fetch key and the route param. When null, the
  // children render bare (no tooltip wrapper).
  userId: string | null | undefined
  // The trigger element (typically a <UserNameCell>). Tooltip opens on hover.
  children: ReactNode
}

interface FetchedData {
  user: UserRow
  ranges: Record<string, Range>
  total: number
  equipment: Equipment
  gearLookup: GearLookup
}

const intFull = new Intl.NumberFormat('en', { maximumFractionDigits: 0 })

/**
 * Wraps a username-shaped trigger with a hover tooltip showing the user's
 * leaderboard stats (vitals, readiness, points/damage/wealth) heat-tinted
 * against the dataset ranges. Data is fetched from `/api/users/[id]` on first
 * open and cached in-process for the rest of the session.
 *
 * When `userId` is null/undefined the children render bare — there's no entity
 * to look up, so no tooltip is shown.
 */
export function UserHoverCard({ userId, children }: Props) {
  const { status, data, onOpenChange } = useEntityHover<FetchedData>(userId ? `/api/users/${userId}` : null)

  return (
    <HoverCardShell
      enabled={!!userId}
      triggerClassName="block min-w-0"
      contentClassName="w-80 p-0"
      onOpenChange={onOpenChange}
      content={status === 'ready' && data ? <Body data={data} /> : <Placeholder status={status} />}
    >
      {children}
    </HoverCardShell>
  )
}

const ICON_CLS = 'size-3 text-neutral-50/70'

function Body({ data }: { data: FetchedData }) {
  const { user, ranges, equipment, gearLookup } = data
  return (
    <>
      <div className="px-3 py-2">
        <div className="flex items-center gap-2">
          <Avatar src={user.avatarUrl} name={user.username} size={26} colorScheme={user.colorScheme} />
          <div className="flex min-w-0 flex-col leading-tight">
            <span className="truncate font-medium">{user.username}</span>
            <span className="flex items-center gap-1 text-[11px] text-neutral-50/70">
              <Flag code={user.countryCode} />
              {user.countryName ?? '—'}
            </span>
          </div>
          {user.level != null && (
            <span className="ml-auto text-[11px] tabular-nums text-neutral-50/70">
              Lv
              {' '}
              {user.level}
            </span>
          )}
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-[11px] text-neutral-50/60">
          <span className="min-w-0 flex-1 truncate">{user.muName ?? '—'}</span>
          <span className="inline-flex shrink-0 items-center gap-1">
            <Clock className={ICON_CLS} />
            {formatRelativeTime(user.lastConnectionAt)}
          </span>
        </div>
      </div>

      <div className="border-y border-neutral-50/15 px-3 py-2">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-wide text-neutral-50/50">Vitals</span>
          <ReadinessBadge status={user.readinessStatus} endsAt={user.readinessEndsAt} withTooltip={false} />
        </div>
        <div className="space-y-1">
          <FillBar icon={<Heart className={ICON_CLS} />} pct={user.health} />
          <FillBar icon={<Drumstick className={ICON_CLS} />} pct={user.hunger} />
        </div>
      </div>

      <div className="border-b border-neutral-50/15 px-3 py-2">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-wide text-neutral-50/50">Gear score</span>
          {user.gearScore != null && <GearScorePill score={user.gearScore} tier={computeGearTier(equipment, gearLookup)} />}
        </div>
        <GearStrip equipment={equipment} gearLookup={gearLookup} />
      </div>

      <div className="px-3 py-2">
        <div className="mb-1 text-[10px] uppercase tracking-wide text-neutral-50/50">Performance</div>
        <div className="space-y-0.5 text-[11px]">
          <StatRow icon={<Trophy className={ICON_CLS} />} label="Points" value={user.points} range={ranges.points} />
          <StatRow icon={<Swords className={ICON_CLS} />} label="Damage" value={user.weeklyDamage} range={ranges.weeklyDamage} />
          <StatRow icon={<Coins className={ICON_CLS} />} label="Wealth" value={user.wealth} range={ranges.wealth} />
        </div>
      </div>
    </>
  )
}

function StatRow({ icon, label, value, range }: { icon: ReactNode, label: string, value: number | null, range: Range | undefined }) {
  return (
    <div className="flex justify-between">
      <span className="inline-flex items-center gap-1.5">{icon}{label}</span>
      <span className="tabular-nums">
        {value == null
          ? <span className="text-neutral-50/40">—</span>
          : (
              <HeatCell value={value} range={range} mode="median">
                {intFull.format(value)}
              </HeatCell>
            )}
      </span>
    </div>
  )
}

// Fixed-size placeholder matching the loaded layout's footprint so the popover
// doesn't jump when data arrives. Loading uses subtle pulses; error swaps in
// a one-line message.
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
        <span className="h-[26px] w-[26px] rounded-full bg-white/10" />
        <div className="flex flex-1 flex-col gap-1">
          <span className="h-3 w-24 rounded bg-white/10" />
          <span className="h-2.5 w-32 rounded bg-white/10" />
        </div>
      </div>
      <div className="space-y-2 border-y border-neutral-50/15 px-3 py-3">
        <span className="block h-1.5 rounded bg-white/10" />
        <span className="block h-1.5 rounded bg-white/10" />
      </div>
      <div className="flex items-end gap-1.5 border-b border-neutral-50/15 px-3 py-2">
        {Array.from({ length: 7 }).map((_, i) => (
          // eslint-disable-next-line react/no-array-index-key -- 7 fixed slots
          <div key={i} className="flex w-9 flex-col items-center gap-0.5">
            <span className="size-9 rounded-md bg-white/10" />
            <span className="h-3" />
          </div>
        ))}
      </div>
      <div className="space-y-1.5 px-3 py-3">
        <span className="block h-2.5 w-full rounded bg-white/10" />
        <span className="block h-2.5 w-full rounded bg-white/10" />
        <span className="block h-2.5 w-full rounded bg-white/10" />
      </div>
    </div>
  )
}
