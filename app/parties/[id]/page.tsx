import type { Metadata } from 'next'

import { notFound } from 'next/navigation'

import { UsersTable } from '@/app/users/users-table'
import { Avatar } from '@/components/avatar'
import { CountryCell } from '@/components/country-cell'
import { DetailHeader, FactRow } from '@/components/detail-header'
import { ExternalLink } from '@/components/external-link'
import { PointsBreakdownPanel } from '@/components/points-breakdown-panel'
import { ScaleBadge } from '@/components/scale-badge'
import { StatCard } from '@/components/stat-card'
import { StatCardGrid } from '@/components/stat-card-grid'
import { UserNameCell } from '@/components/user-name-cell'
import { getSnapshot } from '@/lib/cache/memory'
import { applyQuery, DEFAULT_PAGE_SIZE } from '@/lib/query'
import { wareraUrl } from '@/lib/warera/urls'

export const revalidate = 600

interface PageProps {
  params: Promise<{ id: string }>
}

async function getParty(id: string) {
  const { parties, users } = await getSnapshot()
  const party = parties.find(p => p.id === id)
  if (!party) {
    return null
  }
  // Ranges over the full set, same as the /parties table, so each stat can
  // show where this party sits. No filter/sort; we only want the ranges.
  const { ranges, total } = applyQuery(
    parties,
    { page: 0, pageSize: 1, sort: null, dir: 'asc', filter: '' },
    () => '',
    () => null,
  )

  const memberPage = applyQuery(
    users.filter(u => u.partyId === id),
    { page: 0, pageSize: DEFAULT_PAGE_SIZE, sort: 'points', dir: 'desc', filter: '' },
    () => '',
    row => row.points,
  )

  return { party, ranges: ranges ?? {}, total, memberPage }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const result = await getParty(id)
  if (!result) {
    return { title: 'Party not found' }
  }
  return {
    title: result.party.name,
    description: `WarEra.io political-party stats for ${result.party.name}.`,
  }
}

export default async function PartyDetailPage({ params }: PageProps) {
  const { id } = await params
  const result = await getParty(id)
  if (!result) {
    notFound()
  }
  const { party: p, ranges, total, memberPage } = result

  return (
    <main className="space-y-6 px-6 py-8 sm:px-8 lg:px-12">
      <DetailHeader
        title={p.name}
        emblem={(
          <Avatar
            src={p.avatarUrl}
            name={p.name}
            size={64}
            className="-mt-9"
            style={{ boxShadow: '0 0 0 4px var(--card), 0 0 0 5px var(--border)' }}
          />
        )}
      >
        <FactRow>
          <CountryCell countryCode={p.countryCode} countryName={p.countryName} countryId={p.countryId} />
          <span className="text-muted-foreground">
            <span className="text-foreground font-medium">{p.memberCount.toLocaleString()}</span>
            {' '}
            members
          </span>
          {p.createdAt && <span className="text-muted-foreground">Founded {p.createdAt.slice(0, 10)}</span>}
          <ExternalLink href={wareraUrl('party', p.id)}>WarEra.io</ExternalLink>
        </FactRow>
        <FactRow muted>
          {p.leaderName && (
            <span className="inline-flex items-center gap-2">
              Leader
              <UserNameCell
                userId={p.leaderId}
                name={p.leaderName}
                avatarUrl={p.leaderAvatarUrl}
                colorScheme={p.leaderColorScheme}
              />
            </span>
          )}
          <span className="inline-flex items-center gap-1">Militarism <ScaleBadge value={p.militarism} /></span>
          <span className="inline-flex items-center gap-1">Isolationism <ScaleBadge value={p.isolationism} /></span>
          <span className="inline-flex items-center gap-1">Imperialism <ScaleBadge value={p.imperialism} /></span>
          <span className="inline-flex items-center gap-1">Industrialism <ScaleBadge value={p.industrialism} /></span>
        </FactRow>
      </DetailHeader>

      <PointsBreakdownPanel
        total={p.totalPoints}
        level={p.levelPoints}
        damage={p.damagePoints}
        wealth={p.wealthPoints}
      />

      <StatCardGrid>
        <StatCard label="Members" value={p.memberCount} range={ranges.memberCount} heat="ramp" rank={p.memberCountRank} total={total} />
        <StatCard label="Avg Level" value={p.avgLevel} range={ranges.avgLevel} heat="median" rank={p.avgLevelRank} total={total} />
        <StatCard label="Avg Points" value={p.avgPoints} range={ranges.avgPoints} heat="median" rank={p.avgPointsRank} total={total} />
        <StatCard label="Gems Bought" value={p.gemsPurchasedTotal} range={ranges.gemsPurchasedTotal} heat="ramp" rank={p.gemsPurchasedTotalRank} total={total} />
        <StatCard label="Premium Months" value={p.premiumMonthsTotal} range={ranges.premiumMonthsTotal} heat="ramp" rank={p.premiumMonthsTotalRank} total={total} />
        <StatCard label="Premium Gifts" value={p.premiumGiftsTotal} range={ranges.premiumGiftsTotal} heat="ramp" rank={p.premiumGiftsTotalRank} total={total} />
      </StatCardGrid>

      <section className="space-y-3">
        <h2 className="font-brand text-lg tracking-wide">Members</h2>
        <UsersTable initial={memberPage} baseFilter={`partyId:${p.id}`} />
      </section>
    </main>
  )
}
