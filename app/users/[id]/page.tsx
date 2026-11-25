import type { Metadata } from 'next'

import type { RankMapGroup } from '@/components/detail/rank-map'
import type { UserRow } from '@/lib/rows'
import type { CasesByType } from '@/lib/warera/api'

import { notFound } from 'next/navigation'
import { connection } from 'next/server'
import { cache, Suspense } from 'react'

import { DetailLayout } from '@/components/detail/detail-sidebar'
import { RankMap } from '@/components/detail/rank-map'
import { GROUP_COLOR, pointsGroupOf, rankRow, wealthPartRows } from '@/components/detail/rank-row'
import { RefreshButton } from '@/components/detail/refresh-button'
import { FactoriesSection } from '@/components/factories/factories-section'
import { Panel } from '@/components/panel'
import { ProfileSidebar } from '@/components/profile/profile-sidebar'
import { getSnapshot } from '@/lib/cache/memory'
import { getUserEquipment } from '@/lib/cache/users'
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

  const muMates = user.muId ? users.filter(u => u.muId === user.muId && u.id !== user.id) : []

  return { user, total: users.length, muMates, gearLookup }
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

  const { user, total, muMates, gearLookup } = result

  const cases = await resolveCasesByType(user)

  // Parse the full loadout only when there's a gear section to fill.
  const equipment = user.gearScore != null ? (await getUserEquipment(user.id)) ?? undefined : undefined

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
      <RankMap
        name={user.username}
        total={total}
        unit="players"
        groups={rankGroups(user)}
        members={{ rows: muMates, noun: 'MU mate', players: total }}
      />

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
    pointsGroupOf(
      rankRow('Total', user.points, user.pointsRank, false, 'points'),
      user,
      rankRow('Per day', user.pointsPerDay, user.pointsPerDayRank, false, 'pointsPerDay'),
    ),
    {
      title: 'Combat',
      color: GROUP_COLOR.combat,
      rows: [
        rankRow('Damage', user.damage, user.damageRank, true, 'damage'),
        rankRow('Weekly damage', user.weeklyDamage, user.weeklyDamageRank, true, 'weeklyDamage'),
        rankRow('Military rank', user.militaryRank, user.militaryRankPos),
        rankRow('Terrain', user.terrain, user.terrainRank, false, 'terrain'),
        rankRow('Gear score', user.gearScore, user.gearScoreRank, false, 'gearScore'),
        rankRow('War skills', user.warPoints, user.warPointsRank, false, 'warPoints'),
        rankRow('Bounty', user.bounty, user.bountyRank, true, 'bounty'),
      ],
    },
    {
      title: 'Economy',
      color: GROUP_COLOR.economy,
      rows: [
        rankRow('Wealth', user.wealth, user.wealthRank, true, 'wealth'),
        ...wealthPartRows(user),
        rankRow('Eco skills', user.ecoPoints, user.ecoPointsRank, false, 'ecoPoints'),
      ],
    },
    {
      title: 'Account',
      color: GROUP_COLOR.premium,
      rows: [
        rankRow('Level', user.level, user.levelRank, false, 'level'),
        rankRow('Cases opened', user.casesOpened, user.casesOpenedRank, false, 'casesOpened'),
        rankRow('Gems bought', user.gemsPurchased, user.gemsPurchasedRank, true, 'gemsPurchased'),
        rankRow('Premium months', user.premiumMonths, user.premiumMonthsRank, false, 'premiumMonths'),
        rankRow('Gifts', user.premiumGifts, user.premiumGiftsRank, false, 'premiumGifts'),
        rankRow('Referrals', user.referrals, user.referralsRank, false, 'referrals'),
      ],
    },
  ]
}
