import type { Metadata } from 'next'

import type { RankMapGroup } from '@/components/detail/rank-map/rank-map'
import type { MURow } from '@/lib/rows'

import { notFound } from 'next/navigation'
import { connection } from 'next/server'
import { cache } from 'react'

import { UsersTable } from '@/app/users/users-table'
import { DetailLayout } from '@/components/detail/detail-sidebar'
import { RankMap } from '@/components/detail/rank-map/rank-map'
import {
  GROUP_COLOR,
  pointsGroup,
  premiumGroup,
  rankRow,
  wealthPartRows,
} from '@/components/detail/rank-map/rank-row'
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

  // First page of this MU's members, sorted like /users (points desc). The
  // embedded UsersTable takes over client-side, re-fetching with the same
  // muId scope applied as a base filter.
  const members = users.filter(u => u.muId === id)
  const memberPage = firstPage(members, 'points')

  return { mu, mus, members, players: users.length, memberPage }
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

  const { mu, mus, members, players, memberPage } = result

  return (
    <DetailLayout
      sidebar={(
        <MUSidebar
          mu={mu}
          refresh={<RefreshButton id={mu.id} action={requestMuRefresh} lastRefreshedAt={mu.lastRefreshedAt} />}
        />
      )}
    >
      <PageSection title="Members">
        <UsersTable
          initial={memberPage}
          baseFilter={`muId:${mu.id}`}
          omitColumns={['muName']}
          overview={(
            <RankMap
              name={mu.name}
              total={mus.length}
              unit="MUs"
              groups={rankGroups(mu)}
              peers={{
                selfId: mu.id,
                all: mus.map(m => ({ id: m.id, name: m.name, code: m.countryCode, groups: rankGroups(m) })),
              }}
              members={{ rows: members, noun: 'member', players }}
            />
          )}
        />
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
        rankRow('Damage', mu.damage, mu.damageRank, { compact: true, stat: 'damage' }),
        rankRow('Weekly damage', mu.weeklyDamage, mu.weeklyDamageRank, { compact: true, stat: 'weeklyDamage' }),
        rankRow('Avg gear', mu.avgGearScore, mu.avgGearScoreRank, { stat: 'gearScore' }),
        rankRow('Terrain', mu.terrain, mu.terrainRank, { stat: 'terrain' }),
        rankRow('Bounty', mu.bounty, mu.bountyRank, { compact: true, stat: 'bounty' }),
      ],
    },
    {
      title: 'Economy',
      color: GROUP_COLOR.economy,
      rows: [
        rankRow('MU wealth', mu.wealth, mu.wealthRank, { compact: true }),
        rankRow('Member wealth', mu.memberWealth, mu.memberWealthRank, { compact: true, stat: 'wealth' }),
        ...wealthPartRows(mu),
        rankRow('Invested', mu.investedMoney, mu.investedMoneyRank, { compact: true }),
      ],
    },
    {
      title: 'Society',
      color: GROUP_COLOR.society,
      rows: [
        rankRow('Members', mu.memberCount, mu.memberCountRank),
        rankRow('Avg level', mu.avgLevel, mu.avgLevelRank, { stat: 'level' }),
        rankRow('Reputation', mu.reputation, mu.reputationRank),
        rankRow('Headquarters', mu.headquartersLevel, mu.headquartersLevelRank),
        rankRow('Dormitories', mu.dormitoriesLevel, mu.dormitoriesLevelRank),
      ],
    },
    premiumGroup(mu),
  ]
}
