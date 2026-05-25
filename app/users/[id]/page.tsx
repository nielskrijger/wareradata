import type { Metadata } from 'next'

import { notFound } from 'next/navigation'

import { Avatar } from '@/components/avatar'
import { CompactNumber } from '@/components/compact-number'
import { CountryCell } from '@/components/country-cell'
import { ExternalLink } from '@/components/external-link'
import { MUCell } from '@/components/mu-cell'
import { PartyCell } from '@/components/party-cell'
import { PointsBreakdownPanel } from '@/components/points-breakdown-panel'
import { StatCard } from '@/components/stat-card'
import { TierBadge } from '@/components/tier-badge'
import { Badge } from '@/components/ui/badge'
import { getSnapshot } from '@/lib/cache/memory'
import { EMPTY, formatRelativeTime } from '@/lib/format'
import { applyQuery } from '@/lib/query'
import { schemeRgb } from '@/lib/warera/color-schemes'
import { wareraUrl } from '@/lib/warera/urls'

export const revalidate = 600

interface PageProps {
  params: Promise<{ id: string }>
}

async function getUser(id: string) {
  const { users } = await getSnapshot()
  const user = users.find(u => u.id === id)
  if (!user) {
    return null
  }
  // Ranges over the full ranked set, same as the table, so each stat can show
  // where this player sits. No filter/sort needed; we only want the ranges.
  const { ranges, total } = applyQuery(
    users,
    { page: 0, pageSize: 1, sort: null, dir: 'asc', filter: '' },
    () => '',
    () => null,
  )
  return { user, ranges: ranges ?? {}, total }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const result = await getUser(id)
  if (!result) {
    return { title: 'User not found' }
  }
  return {
    title: result.user.username,
    description: `WarEra.io stats for ${result.user.username}.`,
  }
}

export default async function UserDetailPage({ params }: PageProps) {
  const { id } = await params
  const result = await getUser(id)
  if (!result) {
    notFound()
  }
  const { user, ranges, total } = result

  const rgb = schemeRgb(user.colorScheme)

  return (
    <main className="space-y-6 px-6 py-8 sm:px-8 lg:px-12">
      <div className="bg-card overflow-hidden rounded-md border">
        <div
          className="h-14"
          style={{ background: `linear-gradient(100deg, rgba(${rgb}, 0.38), rgba(${rgb}, 0.06))` }}
        />
        <div className="flex flex-col items-start gap-3 px-4 pb-4">
          <Avatar
            src={user.avatarUrl}
            name={user.username}
            size={64}
            className="-mt-9"
            style={{ boxShadow: `0 0 0 4px var(--card), 0 0 0 5px rgb(${rgb})` }}
          />
          <div className="space-y-1.5">
            <h1 className="font-brand text-[28px] leading-none tracking-wide">{user.username}</h1>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
              <CountryCell countryCode={user.countryCode} countryName={user.countryName} />
              {user.level != null && (
                <span className="text-muted-foreground">
                  Level <span className="text-foreground font-medium">{user.level}</span>
                </span>
              )}
              <TierBadge tier={user.levelTier} />
              {user.isBanned && (
                <Badge className="bg-red-500/15 text-red-900 dark:text-red-300">banned</Badge>
              )}
              <ExternalLink href={wareraUrl('user', user.id)}>WarEra.io</ExternalLink>
            </div>
            <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
              {user.muName && (
                <span className="inline-flex items-center gap-1">MU <MUCell muName={user.muName} muId={user.muId} /></span>
              )}
              {user.partyName && (
                <span className="inline-flex max-w-[16rem] items-center gap-1">Party <PartyCell partyName={user.partyName} /></span>
              )}
              <span>Joined {user.createdAt?.slice(0, 10) ?? EMPTY}</span>
              <span>Last seen {formatRelativeTime(user.lastConnectionAt)}</span>
            </div>
          </div>
        </div>
      </div>

      <PointsBreakdownPanel
        total={user.points}
        level={user.levelPoints}
        damage={user.damagePoints}
        wealth={user.wealthPoints}
        pointsPerDay={user.pointsPerDay}
      />

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        <StatCard label="Level" value={user.level} range={ranges.level} heat="median" rank={user.levelRank} total={total} />
        <StatCard label="Total Damage" value={user.damage} display={<CompactNumber value={user.damage} />} range={ranges.damage} heat="median" rank={user.damageRank} total={total} />
        <StatCard label="Weekly Damage" value={user.weeklyDamage} display={<CompactNumber value={user.weeklyDamage} />} range={ranges.weeklyDamage} heat="median" rank={user.weeklyDamageRank} total={total} />
        <StatCard label="Wealth" value={user.wealth} display={<CompactNumber value={user.wealth} />} range={ranges.wealth} heat="median" rank={user.wealthRank} total={total} />
        <StatCard label="Bounty" value={user.bounty} display={<CompactNumber value={user.bounty} />} range={ranges.bounty} heat="median" rank={user.bountyRank} total={total} />
        <StatCard label="Military Rank" value={user.militaryRank} range={ranges.militaryRank} heat="median" rank={user.militaryRankPos} total={total} />
        <StatCard label="Terrain" value={user.terrain} range={ranges.terrain} heat="median" rank={user.terrainRank} total={total} />
        <StatCard label="Cases Opened" value={user.casesOpened} range={ranges.casesOpened} heat="median" log rank={user.casesOpenedRank} total={total} />
        <StatCard label="Referrals" value={user.referrals} range={ranges.referrals} heat="ramp" rank={user.referralsRank} total={total} />
        <StatCard label="Gems Purchased" value={user.gemsPurchased} range={ranges.gemsPurchased} heat="ramp" rank={user.gemsPurchasedRank} total={total} />
        <StatCard label="Premium Months" value={user.premiumMonths} range={ranges.premiumMonths} heat="ramp" rank={user.premiumMonthsRank} total={total} />
        <StatCard label="Premium Gifts" value={user.premiumGifts} range={ranges.premiumGifts} heat="ramp" rank={user.premiumGiftsRank} total={total} />
      </section>
    </main>
  )
}
