import type { Metadata } from 'next'

import type { RankMapGroup } from '@/components/detail/rank-map'
import type { MURow } from '@/lib/rows'

import { notFound } from 'next/navigation'
import { connection } from 'next/server'
import { cache } from 'react'

import { DetailLayout } from '@/components/detail/detail-sidebar'
import { MembersSection } from '@/components/detail/members-section'
import {
  GROUP_COLOR,
  pointsGroup,
  premiumGroup,
  rankRow,
  wealthPartRows,
} from '@/components/detail/rank-row'
import { RefreshButton } from '@/components/detail/refresh-button'
import { MUSidebar } from '@/components/mu/mu-sidebar'
import { getSnapshot } from '@/lib/cache/memory'
import { pageMetadata } from '@/lib/metadata'
import { groupMembers } from '@/lib/rows'

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

  return { mu, total: mus.length, members: groupMembers(users, u => u.muId === id) }
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

  const { mu, total, members } = result

  return (
    <DetailLayout
      sidebar={(
        <MUSidebar
          mu={mu}
          refresh={<RefreshButton id={mu.id} action={requestMuRefresh} lastRefreshedAt={mu.lastRefreshedAt} />}
        />
      )}
    >
      <MembersSection
        members={members}
        noun="member"
        name={mu.name}
        total={total}
        unit="MUs"
        groups={rankGroups(mu)}
        baseFilter={`muId:${mu.id}`}
        omitColumns={['muName']}
      />
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
        rankRow('Damage', mu.damage, mu.damageRank, true, 'damage'),
        rankRow('Weekly damage', mu.weeklyDamage, mu.weeklyDamageRank, true, 'weeklyDamage'),
        rankRow('Avg gear', mu.avgGearScore, mu.avgGearScoreRank, false, 'gearScore'),
        rankRow('Terrain', mu.terrain, mu.terrainRank, false, 'terrain'),
        rankRow('Bounty', mu.bounty, mu.bountyRank, true, 'bounty'),
      ],
    },
    {
      title: 'Economy',
      color: GROUP_COLOR.economy,
      rows: [
        rankRow('MU wealth', mu.wealth, mu.wealthRank, true),
        rankRow('Member wealth', mu.memberWealth, mu.memberWealthRank, true, 'wealth'),
        ...wealthPartRows(mu),
        rankRow('Invested', mu.investedMoney, mu.investedMoneyRank, true),
      ],
    },
    {
      title: 'Society',
      color: GROUP_COLOR.society,
      rows: [
        rankRow('Members', mu.memberCount, mu.memberCountRank),
        rankRow('Avg level', mu.avgLevel, mu.avgLevelRank, false, 'level'),
        rankRow('Reputation', mu.reputation, mu.reputationRank),
        rankRow('Headquarters', mu.headquartersLevel, mu.headquartersLevelRank),
        rankRow('Dormitories', mu.dormitoriesLevel, mu.dormitoriesLevelRank),
      ],
    },
    premiumGroup(mu),
  ]
}
