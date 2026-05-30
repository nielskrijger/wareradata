import type { Metadata } from 'next'

import { notFound } from 'next/navigation'
import { connection } from 'next/server'

import { Avatar } from '@/components/avatar'
import { ReadinessBadge } from '@/components/badges/readiness-badge'
import { TierBadge } from '@/components/badges/tier-badge'
import { CompactNumber } from '@/components/cells/compact-number'
import { CountryCell } from '@/components/cells/country-cell'
import { MUCell } from '@/components/cells/mu-cell'
import { PartyCell } from '@/components/cells/party-cell'
import { DetailHeader, FactRow } from '@/components/detail/detail-header'
import { GearBand } from '@/components/detail/gear-band'
import { PointsBreakdownPanel } from '@/components/detail/points-breakdown-panel'
import { StatCard } from '@/components/detail/stat-card'
import { StatCardGrid } from '@/components/detail/stat-card-grid'
import { VitalCard } from '@/components/detail/vital-card'
import { ExternalLink } from '@/components/links'
import { RelativeTime } from '@/components/relative-time'
import { Badge } from '@/components/ui/badge'
import { getSnapshot } from '@/lib/cache/memory'
import { EMPTY } from '@/lib/format'
import { applyQuery } from '@/lib/query'
import { schemeRgb } from '@/lib/warera/color-schemes'
import { wareraUrl } from '@/lib/warera/urls'

interface PageProps {
  params: Promise<{ id: string }>
}

async function getUser(id: string) {
  const { users, equipment } = await getSnapshot()
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
  return { user, ranges: ranges ?? {}, total, equipment: equipment[id] ?? {} }
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
  await connection()
  const { id } = await params
  const result = await getUser(id)
  if (!result) {
    notFound()
  }
  const { user, ranges, total, equipment } = result

  const rgb = schemeRgb(user.colorScheme)
  // Show the gear section whenever we captured this user's equipment, even if
  // they're wearing nothing (score 0) — the empty placeholder slots make "not
  // equipped" legible. A null score means we never scraped their gear, so the
  // section stays hidden rather than implying an empty loadout.
  const hasGearData = user.gearScore != null

  return (
    <main className="space-y-6 px-6 py-8 sm:px-8 lg:px-12">
      <DetailHeader
        title={user.username}
        titleSuffix={(
          <>
            {user.levelTier && <TierBadge tier={user.levelTier} />}
            {user.readinessStatus != null && <ReadinessBadge status={user.readinessStatus} />}
          </>
        )}
        bannerStyle={{ background: `linear-gradient(100deg, rgba(${rgb}, 0.38), rgba(${rgb}, 0.06))` }}
        emblem={(
          <Avatar
            src={user.avatarUrl}
            name={user.username}
            size={64}
            className="-mt-9"
            style={{ boxShadow: `0 0 0 4px var(--card), 0 0 0 5px rgb(${rgb})` }}
          />
        )}
        footer={hasGearData ? <GearBand score={user.gearScore} equipment={equipment} /> : undefined}
      >
        <FactRow>
          <CountryCell countryCode={user.countryCode} countryName={user.countryName} countryId={user.countryId} />
          {user.level != null && (
            <span className="text-muted-foreground">
              Level <span className="text-foreground font-medium">{user.level}</span>
            </span>
          )}
          {user.isBanned && (
            <Badge className="bg-red-500/15 text-red-900 dark:text-red-300">banned</Badge>
          )}
          <ExternalLink href={wareraUrl('user', user.id)}>WarEra.io</ExternalLink>
        </FactRow>
        <FactRow muted>
          {user.muName && (
            <span className="inline-flex items-center gap-1">MU <MUCell muName={user.muName} muId={user.muId} /></span>
          )}
          {user.partyName && (
            <span className="inline-flex max-w-[16rem] items-center gap-1">Party <PartyCell partyName={user.partyName} partyId={user.partyId} /></span>
          )}
          <span>Joined {user.createdAt?.slice(0, 10) ?? EMPTY}</span>
          <span>Last seen <RelativeTime iso={user.lastConnectionAt} /></span>
        </FactRow>
      </DetailHeader>

      <PointsBreakdownPanel
        total={user.points}
        level={user.levelPoints}
        damage={user.damagePoints}
        wealth={user.wealthPoints}
        pointsPerDay={user.pointsPerDay}
      />

      <StatCardGrid>
        <VitalCard kind="health" label="Health" value={user.healthPercent} />
        <VitalCard kind="hunger" label="Hunger" value={user.hungerPercent} />
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
      </StatCardGrid>
    </main>
  )
}
