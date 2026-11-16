import type { Metadata } from 'next'

import type { RankMapGroup, RankMapRow } from '@/components/profile/rank-map'
import type { UserRow } from '@/lib/rows'
import type { CasesByType } from '@/lib/warera/api'

import { Coins, Factory, Swords, Trophy } from 'lucide-react'
import { notFound } from 'next/navigation'
import { connection } from 'next/server'
import { cache, Suspense } from 'react'

import { CompactNumber } from '@/components/cells/compact-number'
import { RefreshButton } from '@/components/detail/refresh-button'
import { FactoriesSection, FactoryKpi } from '@/components/factories/factories-section'
import { POINTS_LEGEND } from '@/components/points-breakdown-legend'
import { Kpi } from '@/components/profile/kpi'
import { PointsSplit } from '@/components/profile/points-split'
import { ProfileSidebar } from '@/components/profile/profile-sidebar'
import { RankMap } from '@/components/profile/rank-map'
import { WAR_COLOR } from '@/components/war-eco-colors'
import { getSnapshot } from '@/lib/cache/memory'
import { getUserEquipment } from '@/lib/cache/users'
import { EMPTY } from '@/lib/format'
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
    <main className="grid grid-cols-1 gap-4 px-6 py-8 sm:px-8 lg:px-12 xl:grid-cols-[23.5rem_minmax(0,1fr)]">
      <ProfileSidebar
        user={user}
        total={total}
        cases={cases}
        equipment={equipment}
        gearLookup={gearLookup}
        refresh={<RefreshButton id={user.id} action={requestUserRefresh} lastRefreshedAt={user.lastRefreshedAt} />}
      />

      <div className="flex min-w-0 flex-col gap-4">
        <section className="bg-card grid grid-cols-2 gap-4 rounded-md border p-4 sm:p-5 xl:grid-cols-4">
          <Kpi
            label="Points"
            icon={<Trophy />}
            value={user.points.toLocaleString()}
            sub={user.pointsPerDay != null ? `${user.pointsPerDay.toLocaleString()}/day` : undefined}
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
          <PointsSplit
            className="col-span-full"
            total={user.points}
            level={user.levelPoints}
            damage={user.damagePoints}
            wealth={user.wealthPoints}
          />
        </section>

        <RankMap title={`Where ${user.username} ranks`} total={total} groups={rankGroups(user)} />

        <Suspense
          fallback={(
            <div className="bg-card text-muted-foreground rounded-md border p-4 text-sm">
              Loading factories…
            </div>
          )}
        >
          <FactoriesSection userId={user.id} />
        </Suspense>
      </div>
    </main>
  )
}

/**
 * Every ranked stat, grouped by what it says about the player.
 */
function rankGroups(user: UserRow): RankMapGroup[] {
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
        row('Damage', user.damage, user.damageRank, true),
        row('Weekly damage', user.weeklyDamage, user.weeklyDamageRank, true),
        row('Military rank', user.militaryRank, user.militaryRankPos),
        row('Terrain', user.terrain, user.terrainRank),
        row('Gear score', user.gearScore, user.gearScoreRank),
        row('War skills', user.warPoints, user.warPointsRank),
        row('Bounty', user.bounty, user.bountyRank, true),
      ],
    },
    {
      title: 'Economy',
      color: POINTS_LEGEND.Wealth.color,
      rows: [
        row('Wealth', user.wealth, user.wealthRank, true),
        row('Companies', user.companiesWealth, user.companiesWealthRank, true),
        row('Items', user.itemsWealth, user.itemsWealthRank, true),
        row('Cash', user.cashWealth, user.cashWealthRank, true),
        row('Equipment', user.equipmentWealth, user.equipmentWealthRank, true),
        row('Weapons', user.weaponsWealth, user.weaponsWealthRank, true),
        row('Eco skills', user.ecoPoints, user.ecoPointsRank),
      ],
    },
    {
      title: 'Account',
      color: POINTS_LEGEND.Level.color,
      rows: [
        row('Level', user.level, user.levelRank),
        row('Cases opened', user.casesOpened, user.casesOpenedRank),
        row('Gems bought', user.gemsPurchased, user.gemsPurchasedRank, true),
        row('Premium months', user.premiumMonths, user.premiumMonthsRank),
        row('Gifts', user.premiumGifts, user.premiumGiftsRank),
        row('Referrals', user.referrals, user.referralsRank),
      ],
    },
  ]
}
