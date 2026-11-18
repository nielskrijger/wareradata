import type { Metadata } from 'next'

import type { RankMapGroup } from '@/components/detail/rank-map'
import type { MURow } from '@/lib/rows'

import { notFound } from 'next/navigation'
import { connection } from 'next/server'
import { cache } from 'react'

import { UsersTable } from '@/app/users/users-table'
import { DetailLayout } from '@/components/detail/detail-sidebar'
import { RankMap } from '@/components/detail/rank-map'
import { GROUP_COLOR, pointsGroup, premiumGroup, rankRow, wealthPartRows } from '@/components/detail/rank-row'
import { RefreshButton } from '@/components/detail/refresh-button'
import { PageSection } from '@/components/layout/page-section'
import { MUSidebar } from '@/components/mu/mu-sidebar'
import { getSnapshot } from '@/lib/cache/memory'
import { pageMetadata } from '@/lib/metadata'
import { firstPage } from '@/lib/query'

import { requestMuRefresh } from './actions'

interface PageProps {
  params: Promise<{ id: string }>
}

/**
 * Loads the MU and everything its page renders. Wrapped in React `cache` so
 * `generateMetadata` and the page share one load per request.
 */
const getMU = cache(async (id: string) => {
  const { mus, users } = await getSnapshot()
  const mu = mus.find(m => m.id === id)
  if (!mu) {
    return null
  }

  const total = mus.length

  // First page of this MU's members, sorted like /users (points desc). The
  // embedded UsersTable takes over client-side, re-fetching with the same
  // muId scope applied as a base filter.
  const memberPage = firstPage(users.filter(u => u.muId === id), 'points')

  return { mu, total, memberPage }
})

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const result = await getMU(id)
  if (!result) {
    return { title: 'MU not found' }
  }

  const { mu } = result
  const from = mu.countryName ? ` from ${mu.countryName}` : ''

  return pageMetadata({
    title: mu.name,
    description: `WarEra.io military unit${from} with ${mu.memberCount} members: points, damage, gear and member stats.`,
    path: `/mus/${id}`,
    image: `/og/mus/${id}`,
  })
}

export default async function MUDetailPage({ params }: PageProps) {
  await connection()
  const { id } = await params
  const result = await getMU(id)
  if (!result) {
    notFound()
  }

  const { mu, total, memberPage } = result

  return (
    <DetailLayout
      sidebar={(
        <MUSidebar
          mu={mu}
          refresh={<RefreshButton id={mu.id} action={requestMuRefresh} lastRefreshedAt={mu.lastRefreshedAt} />}
        />
      )}
    >
      <RankMap name={mu.name} total={total} unit="MUs" groups={rankGroups(mu)} />

      <PageSection title="Members">
        <UsersTable initial={memberPage} baseFilter={`muId:${mu.id}`} omitColumns={['muName']} />
      </PageSection>
    </DetailLayout>
  )
}

/**
 * Every ranked stat, grouped by what it says about the MU.
 */
function rankGroups(mu: MURow): RankMapGroup[] {
  return [
    pointsGroup(mu, 'Per member'),
    {
      title: 'Combat',
      color: GROUP_COLOR.combat,
      rows: [
        rankRow('Damage', mu.damage, mu.damageRank, true),
        rankRow('Weekly damage', mu.weeklyDamage, mu.weeklyDamageRank, true),
        rankRow('Avg gear', mu.avgGearScore, mu.avgGearScoreRank),
        rankRow('Terrain', mu.terrain, mu.terrainRank),
        rankRow('Bounty', mu.bounty, mu.bountyRank, true),
      ],
    },
    {
      title: 'Economy',
      color: GROUP_COLOR.economy,
      rows: [
        rankRow('MU wealth', mu.wealth, mu.wealthRank, true),
        rankRow('Member wealth', mu.memberWealth, mu.memberWealthRank, true),
        ...wealthPartRows(mu),
        rankRow('Invested', mu.investedMoney, mu.investedMoneyRank, true),
      ],
    },
    {
      title: 'Society',
      color: GROUP_COLOR.society,
      rows: [
        rankRow('Members', mu.memberCount, mu.memberCountRank),
        rankRow('Avg level', mu.avgLevel, mu.avgLevelRank),
        rankRow('Reputation', mu.reputation, mu.reputationRank),
        rankRow('Headquarters', mu.headquartersLevel, mu.headquartersLevelRank),
        rankRow('Dormitories', mu.dormitoriesLevel, mu.dormitoriesLevelRank),
      ],
    },
    premiumGroup(mu),
  ]
}
