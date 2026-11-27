import type { Metadata } from 'next'

import type { RankMapGroup } from '@/components/detail/rank-map'
import type { AllianceRow } from '@/lib/rows'

import { notFound } from 'next/navigation'
import { connection } from 'next/server'
import { cache } from 'react'

import { UsersTable } from '@/app/users/users-table'
import { AllianceSidebar } from '@/components/alliance/alliance-sidebar'
import { DetailLayout } from '@/components/detail/detail-sidebar'
import { RankMap } from '@/components/detail/rank-map'
import {
  decimalRankRow,
  GROUP_COLOR,
  pointsGroup,
  premiumGroup,
  rankRow,
  wealthPartRows,
} from '@/components/detail/rank-row'
import { PageSection } from '@/components/layout/page-section'
import { getSnapshot } from '@/lib/cache/memory'
import { pageMetadata } from '@/lib/metadata'
import { firstPage } from '@/lib/query'

import { MembersTable } from './members-table'

interface PageProps {
  params: Promise<{ id: string }>
}

/**
 * Loads the alliance and everything its page renders. Wrapped in React `cache` so
 * `generateMetadata` and the page share one load per request.
 */
const getAlliance = cache(async (id: string) => {
  const { alliances, users, strategicBonuses } = await getSnapshot()
  const alliance = alliances.find(a => a.id === id)
  if (!alliance) {
    return null
  }

  // Citizens of all member countries, the alliance-wide equivalent of the
  // country page's citizens tab.
  const memberCodes = new Set(alliance.members.map(m => m.code).filter(Boolean))
  const citizens = users.filter(u => u.countryCode !== null && memberCodes.has(u.countryCode))
  const citizenPage = firstPage(citizens, 'points')

  const strategicBonus = strategicBonuses.byAlliance[id] ?? null

  return { alliance, alliances, citizens, players: users.length, citizenPage, strategicBonus }
})

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const result = await getAlliance(id)
  if (!result) {
    return { title: 'Alliance not found' }
  }

  return pageMetadata({
    title: result.alliance.name,
    description: `WarEra.io alliance stats for ${result.alliance.name}: member countries, strength and wealth.`,
    path: `/alliances/${id}`,
    image: `/og/alliances/${id}`,
  })
}

export default async function AllianceDetailPage({ params }: PageProps) {
  await connection()
  const { id } = await params
  const result = await getAlliance(id)
  if (!result) {
    notFound()
  }

  const { alliance: a, alliances, citizens, players, citizenPage, strategicBonus } = result

  // The user's filter on the citizens table is applied within this scope, so a
  // search can never widen past the alliance's member countries.
  const memberCodes = a.members.map(m => m.code).filter((code): code is string => code !== null)
  const citizensBaseFilter = `(${memberCodes.map(code => `countryCode:${code}`).join(' OR ')})`

  return (
    <DetailLayout
      sidebar={<AllianceSidebar alliance={a} citizenCount={citizenPage.total} strategicBonus={strategicBonus} />}
    >
      <RankMap
        name={a.name}
        total={alliances.length}
        unit="alliances"
        groups={rankGroups(a)}
        peers={{
          selfId: a.id,
          all: alliances.map(p => ({ id: p.id, name: p.name, code: null, groups: rankGroups(p) })),
        }}
        members={{ rows: citizens, noun: 'citizen', players }}
      />

      <PageSection title="Member countries">
        <MembersTable alliance={a} />
      </PageSection>

      <PageSection title="Citizens">
        <UsersTable initial={citizenPage} baseFilter={citizensBaseFilter} />
      </PageSection>
    </DetailLayout>
  )
}

/**
 * Every ranked stat, grouped by what it says about the alliance.
 */
function rankGroups(a: AllianceRow): RankMapGroup[] {
  return [
    pointsGroup(a, 'Per citizen'),
    {
      title: 'Combat',
      color: GROUP_COLOR.combat,
      rows: [
        rankRow('Damage', a.damage, a.damageRank, { compact: true, stat: 'damage' }),
        rankRow('Weekly damage', a.weeklyDamage, a.weeklyDamageRank, { compact: true, stat: 'weeklyDamage' }),
        rankRow('Per citizen', a.weeklyDamagePerCitizen, a.weeklyDamagePerCitizenRank, {
          compact: true,
          stat: 'weeklyDamage',
        }),
        rankRow('Avg gear', a.avgGearScore, a.avgGearScoreRank, { stat: 'gearScore' }),
      ],
    },
    {
      title: 'Economy',
      color: GROUP_COLOR.economy,
      rows: [
        rankRow('Citizen wealth', a.citizenWealth, a.citizenWealthRank, { compact: true, stat: 'wealth' }),
        ...wealthPartRows(a),
      ],
    },
    {
      title: 'Society',
      color: GROUP_COLOR.society,
      rows: [
        decimalRankRow('Development', a.development, a.developmentRank),
        decimalRankRow('Core development', a.coreDevelopment, a.coreDevelopmentRank),
        decimalRankRow('Avg development', a.averageDevelopment, a.averageDevelopmentRank),
        rankRow('Population', a.population, a.populationRank),
      ],
    },
    premiumGroup(a),
  ]
}
