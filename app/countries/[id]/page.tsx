import type { Metadata } from 'next'

import type { RankMapGroup } from '@/components/detail/rank-map'
import type { CountryRow } from '@/lib/rows'

import { Coins, Swords, Trophy, Users } from 'lucide-react'
import { notFound } from 'next/navigation'
import { connection } from 'next/server'
import { cache } from 'react'

import { CompactNumber } from '@/components/cells/compact-number'
import { CountrySidebar } from '@/components/country/country-sidebar'
import { DetailLayout } from '@/components/detail/detail-sidebar'
import { GovernmentSection } from '@/components/detail/government-section'
import { Kpi, KpiStrip } from '@/components/detail/kpi'
import { RankMap } from '@/components/detail/rank-map'
import { decimalRankRow, GROUP_COLOR, premiumGroup, rankRow, wealthPartRows } from '@/components/detail/rank-row'
import { getActiveBattlesByCountry, getLiveActiveBattles } from '@/lib/cache/live-battles'
import { getSnapshot } from '@/lib/cache/memory'
import { formatNumber } from '@/lib/format'
import { pageMetadata } from '@/lib/metadata'
import { computeRanges, firstPage } from '@/lib/query'

import { CountryTables } from './country-tables'

interface PageProps {
  params: Promise<{ id: string }>
}

/**
 * Loads the country and everything its page renders. Wrapped in React `cache` so
 * `generateMetadata` and the page share one load per request.
 */
const getCountry = cache(async (id: string) => {
  const [snapshot, liveActive, activeBattlesByCountry] = await Promise.all([
    getSnapshot(),
    getLiveActiveBattles(),
    getActiveBattlesByCountry(),
  ])

  const { countries, users, mus, parties, governments, strategicBonuses } = snapshot
  const country = countries.find(c => c.id === id)
  if (!country) {
    return null
  }

  const government = governments[id] ?? null
  const strategicBonus = strategicBonuses.byCountry[id] ?? null

  // Ranges over the full set, same as the /countries table, so each stat can
  // show where this country sits.
  const ranges = computeRanges(countries)
  const total = countries.length

  const code = country.code
  const citizenPage = firstPage(users.filter(u => u.countryCode === code), 'points')
  const muPage = firstPage(mus.filter(m => m.countryCode === code), 'totalPoints')
  const partyPage = firstPage(parties.filter(p => p.countryCode === code), 'totalPoints')
  const battlePage = firstPage(liveActive.filter(b => b.attacker.id === id || b.defender.id === id), 'totalDamage')

  // The matchup list for this country's ⚔ pill tooltip, same shape the table
  // cell uses (each battle from this country's point of view).
  const activeBattlesList = activeBattlesByCountry.get(id) ?? []

  return {
    country,
    government,
    strategicBonus,
    ranges,
    total,
    citizenPage,
    muPage,
    partyPage,
    battlePage,
    activeBattlesList,
  }
})

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const result = await getCountry(id)
  if (!result) {
    return { title: 'Country not found' }
  }

  return pageMetadata({
    title: result.country.name,
    description: `WarEra.io country stats for ${result.country.name}: citizens, military units, parties, government, economy and active battles.`,
    path: `/countries/${id}`,
    image: `/og/countries/${id}`,
  })
}

export default async function CountryDetailPage({ params }: PageProps) {
  await connection()
  const { id } = await params
  const result = await getCountry(id)
  if (!result) {
    notFound()
  }

  const {
    country: c,
    government,
    strategicBonus,
    ranges,
    total,
    citizenPage,
    muPage,
    partyPage,
    battlePage,
    activeBattlesList,
  } = result

  return (
    <DetailLayout
      sidebar={(
        <CountrySidebar
          country={c}
          citizenCount={citizenPage.total}
          ranges={ranges}
          activeBattles={{ count: battlePage.total, list: activeBattlesList }}
          strategicBonus={strategicBonus}
        />
      )}
    >
      <KpiStrip points={{ total: c.totalPoints, level: c.levelPoints, damage: c.damagePoints, wealth: c.wealthPoints }}>
        <Kpi
          label="Points"
          icon={<Trophy />}
          value={formatNumber(c.totalPoints)}
          rank={c.totalPointsRank}
          total={total}
        />
        <Kpi
          label="Damage"
          icon={<Swords />}
          value={<CompactNumber value={c.damage} />}
          rank={c.damageRank}
          total={total}
        />
        <Kpi
          label="Wealth"
          icon={<Coins />}
          value={<CompactNumber value={c.wealth} />}
          rank={c.wealthRank}
          total={total}
        />
        <Kpi
          label="Active citizens"
          icon={<Users />}
          value={formatNumber(c.activePopulation)}
          sub={c.avgPoints != null ? `${formatNumber(c.avgPoints)} pts each` : undefined}
          rank={c.activePopulationRank}
          total={total}
        />
      </KpiStrip>

      <RankMap title={`Where ${c.name} ranks`} total={total} unit="countries" groups={rankGroups(c)} />

      <GovernmentSection government={government} />

      <CountryTables
        code={c.code}
        citizens={citizenPage}
        mus={muPage}
        parties={partyPage}
        battles={battlePage}
      />
    </DetailLayout>
  )
}

/**
 * Every ranked stat, grouped by what it says about the country.
 */
function rankGroups(c: CountryRow): RankMapGroup[] {
  return [
    {
      title: 'Combat',
      color: GROUP_COLOR.combat,
      rows: [
        rankRow('Damage', c.damage, c.damageRank, true),
        rankRow('Weekly damage', c.weeklyDamage, c.weeklyDamageRank, true),
        rankRow('Per citizen', c.weeklyDamagePerCitizen, c.weeklyDamagePerCitizenRank, true),
        rankRow('Avg gear', c.avgGearScore, c.avgGearScoreRank),
        rankRow('Bounty', c.bounty, c.bountyRank, true),
      ],
    },
    {
      title: 'Economy',
      color: GROUP_COLOR.economy,
      rows: [
        rankRow('Treasury', c.money, c.moneyRank, true),
        rankRow('Country wealth', c.wealth, c.wealthRank, true),
        rankRow('Citizen wealth', c.citizenWealth, c.citizenWealthRank, true),
        rankRow('Daily income', c.dailyIncome, c.dailyIncomeRank, true),
        decimalRankRow('Development', c.development, c.developmentRank),
        ...wealthPartRows(c),
      ],
    },
    {
      title: 'Society',
      color: GROUP_COLOR.society,
      rows: [
        rankRow('Active pop.', c.activePopulation, c.activePopulationRank),
        rankRow('Avg level', c.avgLevel, c.avgLevelRank),
        rankRow('Avg points', c.avgPoints, c.avgPointsRank, true),
        rankRow('MUs', c.musCount, c.musCountRank),
        rankRow('Parties', c.partyCount, c.partyCountRank),
        rankRow('Allies', c.alliesCount, c.alliesCountRank),
        rankRow('Wars', c.warsCount, c.warsCountRank),
      ],
    },
    premiumGroup(c),
  ]
}
