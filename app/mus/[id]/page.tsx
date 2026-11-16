import type { Metadata } from 'next'

import type { RankMapGroup } from '@/components/detail/rank-map'
import type { SquadMember } from '@/components/mu/squad-map'
import type { MURow } from '@/lib/rows'

import { Coins, Swords, Trophy, Users } from 'lucide-react'
import { notFound } from 'next/navigation'
import { connection } from 'next/server'
import { cache } from 'react'

import { UsersTable } from '@/app/users/users-table'
import { CompactNumber } from '@/components/cells/compact-number'
import { DetailLayout } from '@/components/detail/detail-sidebar'
import { Kpi, KpiStrip } from '@/components/detail/kpi'
import { RankMap } from '@/components/detail/rank-map'
import { rankRow } from '@/components/detail/rank-row'
import { RefreshButton } from '@/components/detail/refresh-button'
import { MUSidebar } from '@/components/mu/mu-sidebar'
import { SquadMap } from '@/components/mu/squad-map'
import { POINTS_LEGEND } from '@/components/points-breakdown-legend'
import { WAR_COLOR } from '@/components/war-eco-colors'
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
  const members = users.filter(u => u.muId === id)
  const memberPage = firstPage(members, 'points')
  const squad: SquadMember[] = members.map(u => ({
    id: u.id,
    username: u.username,
    avatarUrl: u.avatarUrl,
    colorScheme: u.colorScheme,
    level: u.level,
    damage: u.damage,
    wealth: u.wealth,
    health: u.health,
    readinessStatus: u.readinessStatus,
  }))

  return { mu, total, memberPage, squad }
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

  const { mu, total, memberPage, squad } = result

  return (
    <DetailLayout
      sidebar={(
        <MUSidebar
          mu={mu}
          refresh={<RefreshButton id={mu.id} action={requestMuRefresh} lastRefreshedAt={mu.lastRefreshedAt} />}
        />
      )}
    >
      <KpiStrip
        points={{
          total: mu.totalPoints,
          level: mu.levelPoints,
          damage: mu.damagePoints,
          wealth: mu.wealthPoints,
        }}
      >
        <Kpi
          label="Points"
          icon={<Trophy />}
          value={mu.totalPoints.toLocaleString()}
          rank={mu.totalPointsRank}
          total={total}
        />
        <Kpi
          label="Damage"
          icon={<Swords />}
          value={<CompactNumber value={mu.damage} />}
          rank={mu.damageRank}
          total={total}
        />
        <Kpi
          label="Wealth"
          icon={<Coins />}
          value={<CompactNumber value={mu.wealth} />}
          rank={mu.wealthRank}
          total={total}
        />
        <Kpi
          label="Members"
          icon={<Users />}
          value={mu.memberCount.toLocaleString()}
          sub={mu.avgPoints != null ? `${mu.avgPoints.toLocaleString()} pts each` : undefined}
          rank={mu.memberCountRank}
          total={total}
        />
      </KpiStrip>

      <RankMap title={`Where ${mu.name} ranks`} total={total} unit="MUs" groups={rankGroups(mu)} />

      <section className="min-w-0 space-y-3">
        <h2 className="font-brand text-lg tracking-wide">Members</h2>
        <SquadMap members={squad} />
        <UsersTable initial={memberPage} baseFilter={`muId:${mu.id}`} omitColumns={['muName']} />
      </section>
    </DetailLayout>
  )
}

/**
 * Every ranked stat, grouped by what it says about the MU.
 */
function rankGroups(mu: MURow): RankMapGroup[] {
  return [
    {
      title: 'Combat',
      color: WAR_COLOR,
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
      color: POINTS_LEGEND.Wealth.color,
      rows: [
        rankRow('MU wealth', mu.wealth, mu.wealthRank, true),
        rankRow('Member wealth', mu.memberWealth, mu.memberWealthRank, true),
        rankRow('Companies', mu.companiesWealth, mu.companiesWealthRank, true),
        rankRow('Items', mu.itemsWealth, mu.itemsWealthRank, true),
        rankRow('Cash', mu.cashWealth, mu.cashWealthRank, true),
        rankRow('Equipment', mu.equipmentWealth, mu.equipmentWealthRank, true),
        rankRow('Weapons', mu.weaponsWealth, mu.weaponsWealthRank, true),
        rankRow('Invested', mu.investedMoney, mu.investedMoneyRank, true),
      ],
    },
    {
      title: 'Society',
      color: 'var(--heat-blue)',
      rows: [
        rankRow('Members', mu.memberCount, mu.memberCountRank),
        rankRow('Avg level', mu.avgLevel, mu.avgLevelRank),
        rankRow('Avg points', mu.avgPoints, mu.avgPointsRank, true),
        rankRow('Reputation', mu.reputation, mu.reputationRank),
        rankRow('Headquarters', mu.headquartersLevel, mu.headquartersLevelRank),
        rankRow('Dormitories', mu.dormitoriesLevel, mu.dormitoriesLevelRank),
      ],
    },
    {
      title: 'Premium',
      color: POINTS_LEGEND.Level.color,
      rows: [
        rankRow('Gems bought', mu.gemsPurchasedTotal, mu.gemsPurchasedTotalRank, true),
        rankRow('Premium months', mu.premiumMonthsTotal, mu.premiumMonthsTotalRank),
        rankRow('Gifts', mu.premiumGiftsTotal, mu.premiumGiftsTotalRank),
      ],
    },
  ]
}
