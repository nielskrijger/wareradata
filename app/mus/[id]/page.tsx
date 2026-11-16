import type { Metadata } from 'next'

import type { SquadMember } from '@/components/mu/squad-map'
import type { RankMapGroup, RankMapRow } from '@/components/profile/rank-map'
import type { MURow } from '@/lib/rows'

import { Coins, Swords, Trophy, Users } from 'lucide-react'
import { notFound } from 'next/navigation'
import { connection } from 'next/server'
import { cache } from 'react'

import { UsersTable } from '@/app/users/users-table'
import { CompactNumber } from '@/components/cells/compact-number'
import { RefreshButton } from '@/components/detail/refresh-button'
import { MUSidebar } from '@/components/mu/mu-sidebar'
import { SquadMap } from '@/components/mu/squad-map'
import { POINTS_LEGEND } from '@/components/points-breakdown-legend'
import { Kpi } from '@/components/profile/kpi'
import { PointsSplit } from '@/components/profile/points-split'
import { RankMap } from '@/components/profile/rank-map'
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
    <main className="grid grid-cols-1 gap-4 px-6 py-8 sm:px-8 lg:px-12 xl:grid-cols-[23.5rem_minmax(0,1fr)]">
      <MUSidebar
        mu={mu}
        refresh={<RefreshButton id={mu.id} action={requestMuRefresh} lastRefreshedAt={mu.lastRefreshedAt} />}
      />

      <div className="flex min-w-0 flex-col gap-4">
        <section className="bg-card grid grid-cols-2 gap-4 rounded-md border p-4 sm:p-5 xl:grid-cols-4">
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
          <PointsSplit
            className="col-span-full"
            total={mu.totalPoints}
            level={mu.levelPoints}
            damage={mu.damagePoints}
            wealth={mu.wealthPoints}
          />
        </section>

        <RankMap title={`Where ${mu.name} ranks`} total={total} unit="MUs" groups={rankGroups(mu)} />

        <section className="min-w-0 space-y-3">
          <h2 className="font-brand text-lg tracking-wide">Members</h2>
          <SquadMap members={squad} />
          <UsersTable initial={memberPage} baseFilter={`muId:${mu.id}`} omitColumns={['muName']} />
        </section>
      </div>
    </main>
  )
}

/**
 * Every ranked stat, grouped by what it says about the MU.
 */
function rankGroups(mu: MURow): RankMapGroup[] {
  // Compact for the big, skewed stats (damage, gold), plain for small counts.
  const row = (label: string, value: number | null, rank: number | null, compact = false): RankMapRow => ({
    label,
    value,
    rank,
    display: compact ? <CompactNumber value={value} /> : undefined,
  })

  return [
    {
      title: 'Combat',
      color: WAR_COLOR,
      rows: [
        row('Damage', mu.damage, mu.damageRank, true),
        row('Weekly damage', mu.weeklyDamage, mu.weeklyDamageRank, true),
        row('Avg gear', mu.avgGearScore, mu.avgGearScoreRank),
        row('Terrain', mu.terrain, mu.terrainRank),
        row('Bounty', mu.bounty, mu.bountyRank, true),
      ],
    },
    {
      title: 'Economy',
      color: POINTS_LEGEND.Wealth.color,
      rows: [
        row('MU wealth', mu.wealth, mu.wealthRank, true),
        row('Member wealth', mu.memberWealth, mu.memberWealthRank, true),
        row('Companies', mu.companiesWealth, mu.companiesWealthRank, true),
        row('Items', mu.itemsWealth, mu.itemsWealthRank, true),
        row('Cash', mu.cashWealth, mu.cashWealthRank, true),
        row('Equipment', mu.equipmentWealth, mu.equipmentWealthRank, true),
        row('Weapons', mu.weaponsWealth, mu.weaponsWealthRank, true),
        row('Invested', mu.investedMoney, mu.investedMoneyRank, true),
      ],
    },
    {
      title: 'Society',
      color: 'var(--heat-blue)',
      rows: [
        row('Members', mu.memberCount, mu.memberCountRank),
        row('Avg level', mu.avgLevel, mu.avgLevelRank),
        row('Avg points', mu.avgPoints, mu.avgPointsRank, true),
        row('Reputation', mu.reputation, mu.reputationRank),
        row('Headquarters', mu.headquartersLevel, mu.headquartersLevelRank),
        row('Dormitories', mu.dormitoriesLevel, mu.dormitoriesLevelRank),
      ],
    },
    {
      title: 'Premium',
      color: POINTS_LEGEND.Level.color,
      rows: [
        row('Gems bought', mu.gemsPurchasedTotal, mu.gemsPurchasedTotalRank, true),
        row('Premium months', mu.premiumMonthsTotal, mu.premiumMonthsTotalRank),
        row('Gifts', mu.premiumGiftsTotal, mu.premiumGiftsTotalRank),
      ],
    },
  ]
}
