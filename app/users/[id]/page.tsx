import type { Metadata } from 'next'

import type { RankMapGroup } from '@/components/detail/rank-map'
import type { UserRow } from '@/lib/rows'
import type { CasesByType } from '@/lib/warera/api'

import { Coins, Factory, Swords, Trophy } from 'lucide-react'
import { notFound } from 'next/navigation'
import { connection } from 'next/server'
import { cache, Suspense } from 'react'

import { CompactNumber } from '@/components/cells/compact-number'
import { DetailLayout } from '@/components/detail/detail-sidebar'
import { Kpi, KpiStrip } from '@/components/detail/kpi'
import { RankMap } from '@/components/detail/rank-map'
import { GROUP_COLOR, rankRow, wealthPartRows } from '@/components/detail/rank-row'
import { RefreshButton } from '@/components/detail/refresh-button'
import { FactoriesSection, FactoryKpi } from '@/components/factories/factories-section'
import { Panel } from '@/components/panel'
import { ProfileSidebar } from '@/components/profile/profile-sidebar'
import { getSnapshot } from '@/lib/cache/memory'
import { getUserEquipment } from '@/lib/cache/users'
import { EMPTY, formatNumber } from '@/lib/format'
import { pageMetadata } from '@/lib/metadata'

import { getUserCasesByType } from '@/lib/warera/api'
import { requestUserRefresh } from './actions'

interface PageProps {
  params: Promise<{ id: string }>
}

/**
 * Loads the user and everything its page renders. Wrapped in React `cache` so
 * `generateMetadata` and the page share one load per request.
 */
const getUser = cache(async (id: string) => {
  const { users, gearLookup } = await getSnapshot()
  const user = users.find(u => u.id === id)
  if (!user) {
    return null
  }

  return { user, total: users.length, gearLookup }
})

/**
 * The per-type case breakdown, from the snapshot row when the scrape has
 * reached this user, else one live fetch (skipped when they opened none).
 */
async function resolveCasesByType(user: UserRow): Promise<CasesByType> {
  if (user.standardCasesByRarity || user.mythicCasesByRarity) {
    return {
      standardOpened: user.standardCasesOpened,
      mythicOpened: user.mythicCasesOpened,
      standardByRarity: user.standardCasesByRarity,
      mythicByRarity: user.mythicCasesByRarity,
    }
  }

  const live = user.casesOpened ? await getUserCasesByType(user.id) : null

  return live ?? { standardOpened: null, mythicOpened: null, standardByRarity: null, mythicByRarity: null }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const result = await getUser(id)
  if (!result) {
    return { title: 'User not found' }
  }

  const { user } = result
  const facts = [
    user.level != null ? `Level ${user.level}` : null,
    user.countryName ? `from ${user.countryName}` : null,
    user.muName ? `in ${user.muName}` : null,
  ].filter(Boolean).join(' ')

  const summary = `WarEra.io stats for ${user.username}: points, damage, wealth, gear and factories.`

  return pageMetadata({
    title: user.username,
    description: facts ? `${facts}. ${summary}` : summary,
    path: `/users/${id}`,
    image: `/og/users/${id}`,
  })
}

export default async function UserDetailPage({ params }: PageProps) {
  await connection()
  const { id } = await params
  const result = await getUser(id)
  if (!result) {
    notFound()
  }

  const { user, total, gearLookup } = result

  const cases = await resolveCasesByType(user)

  // Parse the full loadout only when there's a gear section to fill.
  const equipment = user.gearScore != null ? (await getUserEquipment(user.id)) ?? undefined : undefined
  const hasFactories = user.factoryCount != null

  return (
    <DetailLayout
      sidebar={(
        <ProfileSidebar
          user={user}
          total={total}
          cases={cases}
          equipment={equipment}
          gearLookup={gearLookup}
          refresh={<RefreshButton id={user.id} action={requestUserRefresh} lastRefreshedAt={user.lastRefreshedAt} />}
        />
      )}
    >
      <KpiStrip
        points={{
          total: user.points,
          level: user.levelPoints,
          damage: user.damagePoints,
          wealth: user.wealthPoints,
        }}
      >
        <Kpi
          label="Points"
          icon={<Trophy />}
          value={formatNumber(user.points)}
          sub={user.pointsPerDay != null ? `${formatNumber(user.pointsPerDay)}/day` : undefined}
          rank={user.pointsRank}
          total={total}
        />
        <Kpi
          label="Damage"
          icon={<Swords />}
          value={<CompactNumber value={user.damage} />}
          rank={user.damageRank}
          total={total}
        />
        <Kpi
          label="Wealth"
          icon={<Coins />}
          value={<CompactNumber value={user.wealth} />}
          rank={user.wealthRank}
          total={total}
        />
        {hasFactories && (
          <Suspense fallback={<Kpi label="Factories" icon={<Factory />} value={EMPTY} sub="Loading…" />}>
            <FactoryKpi userId={user.id} />
          </Suspense>
        )}
      </KpiStrip>

      <RankMap title={`Where ${user.username} ranks`} total={total} unit="players" groups={rankGroups(user)} />

      <Suspense
        fallback={(
          <Panel className="text-muted-foreground text-sm">Loading factories…</Panel>
        )}
      >
        <FactoriesSection userId={user.id} />
      </Suspense>
    </DetailLayout>
  )
}

/**
 * Every ranked stat, grouped by what it says about the player.
 */
function rankGroups(user: UserRow): RankMapGroup[] {
  return [
    {
      title: 'Combat',
      color: GROUP_COLOR.combat,
      rows: [
        rankRow('Damage', user.damage, user.damageRank, true),
        rankRow('Weekly damage', user.weeklyDamage, user.weeklyDamageRank, true),
        rankRow('Military rank', user.militaryRank, user.militaryRankPos),
        rankRow('Terrain', user.terrain, user.terrainRank),
        rankRow('Gear score', user.gearScore, user.gearScoreRank),
        rankRow('War skills', user.warPoints, user.warPointsRank),
        rankRow('Bounty', user.bounty, user.bountyRank, true),
      ],
    },
    {
      title: 'Economy',
      color: GROUP_COLOR.economy,
      rows: [
        rankRow('Wealth', user.wealth, user.wealthRank, true),
        ...wealthPartRows(user),
        rankRow('Eco skills', user.ecoPoints, user.ecoPointsRank),
      ],
    },
    {
      title: 'Account',
      color: GROUP_COLOR.premium,
      rows: [
        rankRow('Level', user.level, user.levelRank),
        rankRow('Cases opened', user.casesOpened, user.casesOpenedRank),
        rankRow('Gems bought', user.gemsPurchased, user.gemsPurchasedRank, true),
        rankRow('Premium months', user.premiumMonths, user.premiumMonthsRank),
        rankRow('Gifts', user.premiumGifts, user.premiumGiftsRank),
        rankRow('Referrals', user.referrals, user.referralsRank),
      ],
    },
  ]
}
