import type { Metadata } from 'next'

import { notFound } from 'next/navigation'
import { connection } from 'next/server'

import { UsersTable } from '@/app/users/users-table'
import { Avatar } from '@/components/avatar'
import { ScaleBadge } from '@/components/badges/scale-badge'
import { CompactNumber } from '@/components/cells/compact-number'
import { CountryCell } from '@/components/cells/country-cell'
import { UserNameCell } from '@/components/cells/user-name-cell'
import { DetailHeader, FactRow } from '@/components/detail/detail-header'
import { MultiStatCard } from '@/components/detail/multi-stat-card'
import { PointsBreakdownPanel } from '@/components/detail/points-breakdown-panel'
import { StatCardGrid } from '@/components/detail/stat-card-grid'
import { WealthCompositionCard } from '@/components/detail/wealth-composition-card'
import { ExternalLink } from '@/components/links'
import { UserHoverCard } from '@/components/user-hover-card'
import { getSnapshot } from '@/lib/cache/memory'
import { applyQuery, computeRanges, DEFAULT_PAGE_SIZE } from '@/lib/query'
import { wareraUrl } from '@/lib/warera/urls'

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
  // show where this party sits.
  const ranges = computeRanges(parties)

  const memberPage = applyQuery(
    users.filter(u => u.partyId === id),
    { page: 0, pageSize: DEFAULT_PAGE_SIZE, sort: 'points', dir: 'desc', filter: '' },
    () => '',
    row => row.points,
  )

  return { party, ranges, memberPage }
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
  await connection()
  const { id } = await params
  const result = await getParty(id)
  if (!result) {
    notFound()
  }
  const { party: p, ranges, memberPage } = result

  return (
    <main className="space-y-3 px-6 py-8 sm:px-8 lg:px-12">
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
              <UserHoverCard userId={p.leaderId}>
                <UserNameCell
                  userId={p.leaderId}
                  name={p.leaderName}
                  avatarUrl={p.leaderAvatarUrl}
                  colorScheme={p.leaderColorScheme}
                />
              </UserHoverCard>
            </span>
          )}
          <span className="inline-flex items-center gap-1">Militarism <ScaleBadge value={p.militarism} /></span>
          <span className="inline-flex items-center gap-1">Isolationism <ScaleBadge value={p.isolationism} /></span>
          <span className="inline-flex items-center gap-1">Imperialism <ScaleBadge value={p.imperialism} /></span>
          <span className="inline-flex items-center gap-1">Industrialism <ScaleBadge value={p.industrialism} /></span>
        </FactRow>
      </DetailHeader>

      <StatCardGrid>
        <PointsBreakdownPanel
          className="sm:col-span-2"
          total={p.totalPoints}
          level={p.levelPoints}
          damage={p.damagePoints}
          wealth={p.wealthPoints}
          caption={{ value: p.avgPoints, unit: 'points/member' }}
        />
        <MultiStatCard
          label="Society"
          rows={[
            { label: 'Members', value: p.memberCount, range: ranges.memberCount, heat: 'ramp', rank: p.memberCountRank },
            { label: 'Avg level', value: p.avgLevel, range: ranges.avgLevel, heat: 'median', rank: p.avgLevelRank },
          ]}
        />
        <WealthCompositionCard
          perCapita={{ count: p.memberCount, unit: 'member' }}
          parts={[
            { label: 'Companies', value: p.companiesWealth, range: ranges.companiesWealth, rank: p.companiesWealthRank },
            { label: 'Items', value: p.itemsWealth, range: ranges.itemsWealth, rank: p.itemsWealthRank },
            { label: 'Cash', value: p.cashWealth, range: ranges.cashWealth, rank: p.cashWealthRank },
            { label: 'Equipment', value: p.equipmentWealth, range: ranges.equipmentWealth, rank: p.equipmentWealthRank },
            { label: 'Weapons', value: p.weaponsWealth, range: ranges.weaponsWealth, rank: p.weaponsWealthRank },
          ]}
        />
        <MultiStatCard
          label="Premium"
          rows={[
            { label: 'Gems bought', value: p.gemsPurchasedTotal, display: <CompactNumber value={p.gemsPurchasedTotal} />, range: ranges.gemsPurchasedTotal, heat: 'ramp', rank: p.gemsPurchasedTotalRank },
            { label: 'Months', value: p.premiumMonthsTotal, range: ranges.premiumMonthsTotal, heat: 'ramp', rank: p.premiumMonthsTotalRank },
            { label: 'Gifts', value: p.premiumGiftsTotal, range: ranges.premiumGiftsTotal, heat: 'ramp', rank: p.premiumGiftsTotalRank },
          ]}
        />
      </StatCardGrid>

      <section className="space-y-3">
        <h2 className="font-brand text-lg tracking-wide">Members</h2>
        <UsersTable initial={memberPage} baseFilter={`partyId:${p.id}`} />
      </section>
    </main>
  )
}
