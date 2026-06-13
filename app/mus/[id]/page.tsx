import type { Metadata } from 'next'

import { notFound } from 'next/navigation'
import { connection } from 'next/server'

import { UsersTable } from '@/app/users/users-table'
import { Avatar } from '@/components/avatar'
import { TierBadge } from '@/components/badges/tier-badge'
import { CompactNumber } from '@/components/cells/compact-number'
import { CountryCell } from '@/components/cells/country-cell'
import { UserNameCell } from '@/components/cells/user-name-cell'
import { CombatModeCard } from '@/components/detail/combat-mode-card'
import { DetailHeader, FactRow } from '@/components/detail/detail-header'
import { MultiStatCard } from '@/components/detail/multi-stat-card'
import { PointsBreakdownPanel } from '@/components/detail/points-breakdown-panel'
import { RefreshButton } from '@/components/detail/refresh-button'
import { StatCardGrid } from '@/components/detail/stat-card-grid'
import { VitalsCard } from '@/components/detail/vitals-card'
import { WealthCompositionCard } from '@/components/detail/wealth-composition-card'
import { ExternalLink } from '@/components/links'
import { ReadinessPillCard } from '@/components/readiness-pill-card'
import { UserHoverCard } from '@/components/user-hover-card'
import { getSnapshot } from '@/lib/cache/memory'
import { computeRanges, firstPage } from '@/lib/query'
import { wareraUrl } from '@/lib/warera/urls'

import { requestMuRefresh } from './actions'

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
  // where this MU sits.
  const ranges = computeRanges(mus)
  const total = mus.length

  // First page of this MU's members, sorted like /users (points desc). The
  // embedded UsersTable takes over client-side, re-fetching with the same
  // muId scope applied as a base filter.
  const members = users.filter(u => u.muId === id)
  const memberPage = firstPage(members, 'points')

  return { mu, ranges, total, memberPage }
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
  await connection()
  const { id } = await params
  const result = await getMU(id)
  if (!result) {
    notFound()
  }
  const { mu, ranges, total, memberPage } = result

  return (
    <main className="space-y-3 px-6 py-8 sm:px-8 lg:px-12">
      <DetailHeader
        title={mu.name}
        titleSuffix={mu.damageTier ? <TierBadge tier={mu.damageTier} /> : undefined}
        emblem={(
          <Avatar
            src={mu.avatarUrl}
            name={mu.name}
            size={64}
            className="-mt-9"
            style={{ boxShadow: '0 0 0 4px var(--card), 0 0 0 5px var(--border)' }}
          />
        )}
        aside={<RefreshButton id={mu.id} action={requestMuRefresh} lastRefreshedAt={mu.lastRefreshedAt} />}
      >
        <FactRow>
          <CountryCell countryCode={mu.countryCode} countryName={mu.countryName} countryId={mu.countryId} />
          {mu.regionName && <span className="text-muted-foreground">{mu.regionName}</span>}
          <span className="text-muted-foreground">
            <span className="text-foreground font-medium">{mu.memberCount.toLocaleString()}</span>
            {' '}
            members
          </span>
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

      <StatCardGrid>
        <PointsBreakdownPanel
          className="sm:col-span-2"
          total={mu.totalPoints}
          level={mu.levelPoints}
          damage={mu.damagePoints}
          wealth={mu.wealthPoints}
          caption={{ value: mu.avgPoints, unit: 'points/member' }}
        />
        <ReadinessPillCard mix={mu.readinessPill} />
        <CombatModeCard avgWarShare={mu.avgWarShare} rank={mu.avgWarShareRank} total={total} />
        <VitalsCard average health={mu.avgHealth} hunger={mu.avgHunger} />
        <MultiStatCard
          label="Damage"
          total={total}
          hero={{ label: 'Total', value: mu.damage, display: <CompactNumber value={mu.damage} />, range: ranges.damage, heat: 'median', rank: mu.damageRank }}
          rows={[
            { label: 'Weekly', value: mu.weeklyDamage, display: <CompactNumber value={mu.weeklyDamage} />, range: ranges.weeklyDamage, heat: 'median', rank: mu.weeklyDamageRank },
            { label: 'Avg gear', value: mu.avgGearScore, range: ranges.avgGearScore, heat: 'median', rank: mu.avgGearScoreRank },
            { label: 'Terrain', value: mu.terrain, range: ranges.terrain, heat: 'median', rank: mu.terrainRank },
          ]}
        />
        <MultiStatCard
          label="Economy"
          rows={[
            { label: 'MU Wealth', value: mu.wealth, display: <CompactNumber value={mu.wealth} />, range: ranges.wealth, heat: 'median', rank: mu.wealthRank },
            { label: 'Member Wealth', value: mu.memberWealth, display: <CompactNumber value={mu.memberWealth} />, range: ranges.memberWealth, heat: 'median', rank: mu.memberWealthRank },
            { label: 'Bounty', value: mu.bounty, display: <CompactNumber value={mu.bounty} />, range: ranges.bounty, heat: 'median', rank: mu.bountyRank },
            { label: 'Invested', value: mu.investedMoney, display: <CompactNumber value={mu.investedMoney} />, range: ranges.investedMoney, heat: 'ramp', rank: mu.investedMoneyRank },
          ]}
        />
        <WealthCompositionCard
          perCapita={{ count: mu.memberCount, unit: 'member' }}
          parts={[
            { label: 'Companies', value: mu.companiesWealth, range: ranges.companiesWealth, rank: mu.companiesWealthRank },
            { label: 'Items', value: mu.itemsWealth, range: ranges.itemsWealth, rank: mu.itemsWealthRank },
            { label: 'Cash', value: mu.cashWealth, range: ranges.cashWealth, rank: mu.cashWealthRank },
            { label: 'Equipment', value: mu.equipmentWealth, range: ranges.equipmentWealth, rank: mu.equipmentWealthRank },
            { label: 'Weapons', value: mu.weaponsWealth, range: ranges.weaponsWealth, rank: mu.weaponsWealthRank },
          ]}
        />
        <MultiStatCard
          label="Society"
          rows={[
            { label: 'Members', value: mu.memberCount, range: ranges.memberCount, heat: 'ramp', rank: mu.memberCountRank },
            { label: 'Avg level', value: mu.avgLevel, range: ranges.avgLevel, heat: 'median', rank: mu.avgLevelRank },
            { label: 'Avg points', value: mu.avgPoints, range: ranges.avgPoints, heat: 'median', rank: mu.avgPointsRank },
            { label: 'Reputation', value: mu.reputation, range: ranges.reputation, heat: 'median', center: 0, rank: mu.reputationRank },
          ]}
        />
        <MultiStatCard
          label="Facilities"
          rows={[
            { label: 'Dorms', value: mu.dormitoriesLevel, range: ranges.dormitoriesLevel, heat: 'median', rank: mu.dormitoriesLevelRank },
            { label: 'HQ', value: mu.headquartersLevel, range: ranges.headquartersLevel, heat: 'median', center: 2.5, rank: mu.headquartersLevelRank },
          ]}
        />
        <MultiStatCard
          label="Premium"
          rows={[
            { label: 'Gems bought', value: mu.gemsPurchasedTotal, display: <CompactNumber value={mu.gemsPurchasedTotal} />, range: ranges.gemsPurchasedTotal, heat: 'ramp', rank: mu.gemsPurchasedTotalRank },
            { label: 'Months', value: mu.premiumMonthsTotal, range: ranges.premiumMonthsTotal, heat: 'ramp', rank: mu.premiumMonthsTotalRank },
            { label: 'Gifts', value: mu.premiumGiftsTotal, range: ranges.premiumGiftsTotal, heat: 'ramp', rank: mu.premiumGiftsTotalRank },
          ]}
        />
      </StatCardGrid>

      <section className="space-y-3">
        <h2 className="font-brand text-lg tracking-wide">Members</h2>
        <UsersTable initial={memberPage} baseFilter={`muId:${mu.id}`} />
      </section>
    </main>
  )
}
