'use client'

import type { ReactNode } from 'react'

import type { UserDetails } from '@/lib/cache/users'
import type { Range } from '@/lib/query'

import { Clock, Coins, Drumstick, Heart, Swords, Trophy } from 'lucide-react'

import { Avatar } from '@/components/avatar'
import { BuffBadge } from '@/components/badges/buff-badge'
import { GearScorePill } from '@/components/badges/gear-score-pill'
import { PrestigeSkull } from '@/components/cells/prestige-skull'
import { HeatCell } from '@/components/data-table/heat-cell'
import { GearStrip } from '@/components/detail/gear-strip'
import { Flag } from '@/components/flag'
import { EntityHoverCard } from '@/components/hover-card/entity-hover-card'
import { FillBar } from '@/components/hover-card/fill-bar'
import { HoverLabel } from '@/components/hover-card/hover-card-parts'
import { EMPTY, formatNumber, formatRelativeTime } from '@/lib/format'
import { computeGearTier } from '@/lib/gear/score'

interface Props {
  /**
   * User id used as both the fetch key and the route param. When null, the
   * children render bare (no tooltip wrapper).
   */
  userId: string | null | undefined

  /**
   * The trigger element (typically a <UserNameCell>). Tooltip opens on hover.
   */
  children: ReactNode
}

/**
 * A tooltip of the user's stats, heat-tinted against all users. Fetched on
 * first open; with no `userId` the children render bare.
 */
export function UserHoverCard({ userId, children }: Props) {
  return (
    <EntityHoverCard<UserDetails>
      url={userId ? `/api/users/${userId}` : null}
      renderBody={data => <Body data={data} />}
      skeleton={<Skeleton />}
    >
      {children}
    </EntityHoverCard>
  )
}

const ICON = 'size-3 text-neutral-50/70'

function Body({ data }: { data: UserDetails }) {
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
              {user.countryName ?? EMPTY}
            </span>
          </div>
          {user.level != null && (
            <span className="ml-auto inline-flex items-center gap-1 text-[11px] tabular-nums text-neutral-50/70">
              <PrestigeSkull
                prestige={user.prestige}
                className="bg-neutral-50/10 text-neutral-50/70 ring-neutral-50/25"
              />
              Lv
              {' '}
              {user.level}
            </span>
          )}
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-[11px] text-neutral-50/60">
          <span className="min-w-0 flex-1 truncate">{user.muName ?? EMPTY}</span>
          <span className="inline-flex shrink-0 items-center gap-1">
            <Clock className={ICON} />
            {formatRelativeTime(user.lastConnectionAt)}
          </span>
        </div>
      </div>

      <div className="border-y border-neutral-50/15 px-3 py-2">
        <div className="mb-1.5 flex items-center justify-between">
          <HoverLabel>Vitals</HoverLabel>
          <BuffBadge status={user.buffStatus} endsAt={user.buffEndsAt} withTooltip={false} />
        </div>
        <div className="space-y-1">
          <FillBar icon={<Heart className={ICON} />} pct={user.health} />
          <FillBar icon={<Drumstick className={ICON} />} pct={user.hunger} />
        </div>
      </div>

      <div className="border-b border-neutral-50/15 px-3 py-2">
        <div className="mb-1.5 flex items-center justify-between">
          <HoverLabel>Gear score</HoverLabel>
          {user.gearScore != null && (
            <GearScorePill
              score={user.gearScore}
              tier={computeGearTier(
                equipment,
                gearLookup,
              )}
            />
          )}
        </div>
        <GearStrip equipment={equipment} gearLookup={gearLookup} />
      </div>

      <div className="px-3 py-2">
        <HoverLabel className="mb-1 block">Performance</HoverLabel>
        <div className="space-y-0.5 text-[11px]">
          <StatRow icon={<Trophy className={ICON} />} label="Points" value={user.points} range={ranges.points} />
          <StatRow
            icon={<Swords className={ICON} />}
            label="Damage"
            value={user.weeklyDamage}
            range={ranges.weeklyDamage}
          />
          <StatRow icon={<Coins className={ICON} />} label="Wealth" value={user.wealth} range={ranges.wealth} />
        </div>
      </div>
    </>
  )
}

function StatRow({ icon, label, value, range }: {
  icon: ReactNode
  label: string
  value: number | null
  range: Range | undefined
}) {
  return (
    <div className="flex justify-between">
      <span className="inline-flex items-center gap-1.5">{icon}{label}</span>
      <span className="tabular-nums">
        {value == null ? <span className="text-neutral-50/40">{EMPTY}</span> : (
          <HeatCell value={value} range={range} mode="median">
            {formatNumber(value, 0)}
          </HeatCell>
        )}
      </span>
    </div>
  )
}

/**
 * Pulses in the loaded layout's footprint.
 */
function Skeleton() {
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
