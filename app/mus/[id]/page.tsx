import type { Metadata } from 'next'

import { notFound } from 'next/navigation'

import { UsersTable } from '@/app/users/users-table'
import { Avatar } from '@/components/avatar'
import { CompactNumber } from '@/components/compact-number'
import { CountryCell } from '@/components/country-cell'
import { DetailHeader, FactRow } from '@/components/detail-header'
import { ExternalLink } from '@/components/links'
import { PointsBreakdownPanel } from '@/components/points-breakdown-panel'
import { ReadinessPillCard } from '@/components/readiness-pill-bar'
import { StatCard } from '@/components/stat-card'
import { StatCardGrid } from '@/components/stat-card-grid'
import { TierBadge } from '@/components/tier-badge'
import { UserHoverCard } from '@/components/user-hover-card'
import { UserNameCell } from '@/components/user-name-cell'
import { VitalCard } from '@/components/vital-card'
import { getSnapshot } from '@/lib/cache/memory'
import { applyQuery, DEFAULT_PAGE_SIZE } from '@/lib/query'
import { wareraUrl } from '@/lib/warera/urls'

import { RefreshButton } from './refresh-button'

interface PageProps {
  params: Promise<{ id: string }>
}

async function getMU(id: string) {
  const { mus, users } = await getSnapshot()
  const mu = mus.find(m => m.id === id)
  if (!mu) {
    return null
  }
  // Ranges over the full set, same as the /mus table, so each stat can show
  // where this MU sits. No filter/sort needed; we only want the ranges.
  const { ranges, total } = applyQuery(
    mus,
    { page: 0, pageSize: 1, sort: null, dir: 'asc', filter: '' },
    () => '',
    () => null,
  )

  // First page of this MU's members, sorted like /users (points desc). The
  // embedded UsersTable takes over client-side, re-fetching with the same
  // muId scope applied as a base filter.
  const members = users.filter(u => u.muId === id)
  const memberPage = applyQuery(
    members,
    { page: 0, pageSize: DEFAULT_PAGE_SIZE, sort: 'points', dir: 'desc', filter: '' },
    () => '',
    row => row.points,
  )

  return { mu, ranges: ranges ?? {}, total, memberPage }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const result = await getMU(id)
  if (!result) {
    return { title: 'MU not found' }
  }
  return {
    title: result.mu.name,
    description: `WarEra.io military-unit stats for ${result.mu.name}.`,
  }
}

export default async function MUDetailPage({ params }: PageProps) {
  const { id } = await params
  const result = await getMU(id)
  if (!result) {
    notFound()
  }
  const { mu, ranges, total, memberPage } = result

  return (
    <main className="space-y-6 px-6 py-8 sm:px-8 lg:px-12">
      <DetailHeader
        title={mu.name}
        emblem={(
          <Avatar
            src={mu.avatarUrl}
            name={mu.name}
            size={64}
            className="-mt-9"
            style={{ boxShadow: '0 0 0 4px var(--card), 0 0 0 5px var(--border)' }}
          />
        )}
        aside={<RefreshButton muId={mu.id} lastRefreshedAt={mu.lastRefreshedAt} />}
      >
        <FactRow>
          <CountryCell countryCode={mu.countryCode} countryName={mu.countryName} countryId={mu.countryId} />
          {mu.regionName && <span className="text-muted-foreground">{mu.regionName}</span>}
          <span className="text-muted-foreground">
            <span className="text-foreground font-medium">{mu.memberCount.toLocaleString()}</span>
            {' '}
            members
          </span>
          <TierBadge tier={mu.damageTier} />
        </FactRow>
        <FactRow muted>
          {mu.leaderName && (
            <span className="inline-flex items-center gap-2">
              Leader
              <UserHoverCard userId={mu.leaderId}>
                <UserNameCell
                  userId={mu.leaderId}
                  name={mu.leaderName}
                  avatarUrl={mu.leaderAvatarUrl}
                  colorScheme={mu.leaderColorScheme}
                />
              </UserHoverCard>
            </span>
          )}
          <ExternalLink href={wareraUrl('mu', mu.id)}>WarEra.io</ExternalLink>
        </FactRow>
      </DetailHeader>

      <PointsBreakdownPanel
        total={mu.totalPoints}
        level={mu.levelPoints}
        damage={mu.damagePoints}
        wealth={mu.wealthPoints}
      />

      <StatCardGrid>
        <ReadinessPillCard mix={mu.readinessPill} />
        <VitalCard kind="health" value={mu.avgHealth} rank={mu.avgHealthRank} total={total} />
        <VitalCard kind="hunger" value={mu.avgHunger} rank={mu.avgHungerRank} total={total} />
        <StatCard label="Members" value={mu.memberCount} range={ranges.memberCount} heat="ramp" rank={mu.memberCountRank} total={total} />
        <StatCard label="Avg Level" value={mu.avgLevel} range={ranges.avgLevel} heat="median" rank={mu.avgLevelRank} total={total} />
        <StatCard label="Avg Points" value={mu.avgPoints} range={ranges.avgPoints} heat="median" rank={mu.avgPointsRank} total={total} />
        <StatCard label="Total Damage" value={mu.damage} display={<CompactNumber value={mu.damage} />} range={ranges.damage} heat="median" rank={mu.damageRank} total={total} />
        <StatCard label="Weekly Damage" value={mu.weeklyDamage} display={<CompactNumber value={mu.weeklyDamage} />} range={ranges.weeklyDamage} heat="median" rank={mu.weeklyDamageRank} total={total} />
        <StatCard label="Wealth" value={mu.wealth} display={<CompactNumber value={mu.wealth} />} range={ranges.wealth} heat="median" rank={mu.wealthRank} total={total} />
        <StatCard label="Bounty" value={mu.bounty} display={<CompactNumber value={mu.bounty} />} range={ranges.bounty} heat="median" rank={mu.bountyRank} total={total} />
        <StatCard label="Terrain" value={mu.terrain} range={ranges.terrain} heat="median" rank={mu.terrainRank} total={total} />
        <StatCard label="Reputation" value={mu.reputation} range={ranges.reputation} heat="median" center={0} rank={mu.reputationRank} total={total} />
        <StatCard label="Invested" value={mu.investedMoney} display={<CompactNumber value={mu.investedMoney} />} range={ranges.investedMoney} heat="ramp" rank={mu.investedMoneyRank} total={total} />
        <StatCard label="Dorms" value={mu.dormitoriesLevel} range={ranges.dormitoriesLevel} heat="median" rank={mu.dormitoriesLevelRank} total={total} />
        <StatCard label="HQ" value={mu.headquartersLevel} range={ranges.headquartersLevel} heat="median" center={2.5} rank={mu.headquartersLevelRank} total={total} />
        <StatCard label="Gems Bought" value={mu.gemsPurchasedTotal} range={ranges.gemsPurchasedTotal} heat="ramp" rank={mu.gemsPurchasedTotalRank} total={total} />
        <StatCard label="Premium Months" value={mu.premiumMonthsTotal} range={ranges.premiumMonthsTotal} heat="ramp" rank={mu.premiumMonthsTotalRank} total={total} />
        <StatCard label="Premium Gifts" value={mu.premiumGiftsTotal} range={ranges.premiumGiftsTotal} heat="ramp" rank={mu.premiumGiftsTotalRank} total={total} />
      </StatCardGrid>

      <section className="space-y-3">
        <h2 className="font-brand text-lg tracking-wide">Members</h2>
        <UsersTable initial={memberPage} baseFilter={`muId:${mu.id}`} />
      </section>
    </main>
  )
}
