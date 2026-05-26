import type { Metadata } from 'next'

import { notFound } from 'next/navigation'

import { BattleCountBadge } from '@/components/battle-count-badge'
import { CompactNumber } from '@/components/compact-number'
import { DetailHeader, FactRow } from '@/components/detail-header'
import { ExternalLink } from '@/components/external-link'
import { Flag } from '@/components/flag'
import { PointsBreakdownPanel } from '@/components/points-breakdown-panel'
import { ReadinessPillCard } from '@/components/readiness-pill-bar'
import { StatCard } from '@/components/stat-card'
import { StatCardGrid } from '@/components/stat-card-grid'
import { TierBadge } from '@/components/tier-badge'
import { VitalCard } from '@/components/vital-card'
import { getLiveActiveBattles } from '@/lib/cache/live-battles'
import { getSnapshot } from '@/lib/cache/memory'
import { applyQuery, DEFAULT_PAGE_SIZE } from '@/lib/query'
import { wareraUrl } from '@/lib/warera/urls'

import { CountryTables } from './country-tables'

// Active battles are fetched live (60s cache), so this page can't be static.
export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ id: string }>
}

async function getCountry(id: string) {
  const [{ countries, users, mus, parties }, liveActive] = await Promise.all([
    getSnapshot(),
    getLiveActiveBattles(),
  ])
  const country = countries.find(c => c.id === id)
  if (!country) {
    return null
  }
  // Ranges over the full set, same as the /countries table, so each stat can
  // show where this country sits. No filter/sort; we only want the ranges.
  const { ranges, total } = applyQuery(
    countries,
    { page: 0, pageSize: 1, sort: null, dir: 'asc', filter: '' },
    () => '',
    () => null,
  )

  const code = country.code
  const citizenPage = applyQuery(
    users.filter(u => u.countryCode === code),
    { page: 0, pageSize: DEFAULT_PAGE_SIZE, sort: 'points', dir: 'desc', filter: '' },
    () => '',
    row => row.points,
  )
  const muPage = applyQuery(
    mus.filter(m => m.countryCode === code),
    { page: 0, pageSize: DEFAULT_PAGE_SIZE, sort: 'totalPoints', dir: 'desc', filter: '' },
    () => '',
    row => row.totalPoints,
  )
  const partyPage = applyQuery(
    parties.filter(p => p.countryCode === code),
    { page: 0, pageSize: DEFAULT_PAGE_SIZE, sort: 'totalPoints', dir: 'desc', filter: '' },
    () => '',
    row => row.totalPoints,
  )
  const battlePage = applyQuery(
    liveActive.filter(b => b.attacker.id === id || b.defender.id === id),
    { page: 0, pageSize: DEFAULT_PAGE_SIZE, sort: 'totalDamage', dir: 'desc', filter: '' },
    () => '',
    row => row.totalDamage,
  )

  return { country, ranges: ranges ?? {}, total, citizenPage, muPage, partyPage, battlePage }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const result = await getCountry(id)
  if (!result) {
    return { title: 'Country not found' }
  }
  return {
    title: result.country.name,
    description: `WarEra.io country stats for ${result.country.name}.`,
  }
}

export default async function CountryDetailPage({ params }: PageProps) {
  const { id } = await params
  const result = await getCountry(id)
  if (!result) {
    notFound()
  }
  const { country: c, ranges, total, citizenPage, muPage, partyPage, battlePage } = result

  return (
    <main className="space-y-6 px-6 py-8 sm:px-8 lg:px-12">
      <DetailHeader
        title={c.name}
        emblem={(
          <Flag
            code={c.code}
            className="-mt-9 rounded-md"
            style={{
              width: 64,
              height: 48,
              backgroundSize: 'cover',
              boxShadow: '0 0 0 4px var(--card), 0 0 0 5px var(--border)',
            }}
          />
        )}
      >
        <FactRow>
          <span className="text-muted-foreground">
            <span className="text-foreground font-medium">{citizenPage.total.toLocaleString()}</span>
            {' '}
            citizens
          </span>
          <span className="text-muted-foreground">
            <span className="text-foreground font-medium">{c.musCount.toLocaleString()}</span>
            {' '}
            MUs
          </span>
          <span className="text-muted-foreground">
            <span className="text-foreground font-medium">{c.partyCount.toLocaleString()}</span>
            {' '}
            parties
          </span>
          <TierBadge tier={c.damageTier} />
          <BattleCountBadge count={battlePage.total} />
          <ExternalLink href={wareraUrl('country', c.id)}>WarEra.io</ExternalLink>
        </FactRow>
      </DetailHeader>

      <PointsBreakdownPanel
        total={c.totalPoints}
        level={c.levelPoints}
        damage={c.damagePoints}
        wealth={c.wealthPoints}
      />

      <StatCardGrid>
        <ReadinessPillCard mix={c.readinessPill} />
        <VitalCard kind="health" value={c.avgHealth} rank={c.avgHealthRank} total={total} />
        <VitalCard kind="hunger" value={c.avgHunger} rank={c.avgHungerRank} total={total} />
        <StatCard label="Active Pop." value={c.activePopulation} range={ranges.activePopulation} heat="ramp" rank={c.activePopulationRank} total={total} />
        <StatCard label="Avg Level" value={c.avgLevel} range={ranges.avgLevel} heat="median" rank={c.avgLevelRank} total={total} />
        <StatCard label="Avg Points" value={c.avgPoints} range={ranges.avgPoints} heat="median" rank={c.avgPointsRank} total={total} />
        <StatCard label="Total Damage" value={c.damage} display={<CompactNumber value={c.damage} />} range={ranges.damage} heat="median" rank={c.damageRank} total={total} />
        <StatCard label="Weekly Damage" value={c.weeklyDamage} display={<CompactNumber value={c.weeklyDamage} />} range={ranges.weeklyDamage} heat="median" rank={c.weeklyDamageRank} total={total} />
        <StatCard label="Weekly / Citizen" value={c.weeklyDamagePerCitizen} display={<CompactNumber value={c.weeklyDamagePerCitizen} />} range={ranges.weeklyDamagePerCitizen} heat="median" rank={c.weeklyDamagePerCitizenRank} total={total} />
        <StatCard label="Wealth" value={c.wealth} display={<CompactNumber value={c.wealth} />} range={ranges.wealth} heat="median" rank={c.wealthRank} total={total} />
        <StatCard label="Bounty" value={c.bounty} display={<CompactNumber value={c.bounty} />} range={ranges.bounty} heat="ramp" rank={c.bountyRank} total={total} />
        <StatCard label="Treasury" value={c.money} display={<CompactNumber value={c.money} />} range={ranges.money} heat="median" rank={c.moneyRank} total={total} />
        <StatCard label="Development" value={c.development} range={ranges.development} heat="median" rank={c.developmentRank} total={total} />
        <StatCard label="Prod. Bonus" value={c.productionBonus} display={c.productionBonus != null ? `${c.productionBonus}%` : undefined} range={ranges.productionBonus} heat="median" rank={c.productionBonusRank} total={total} />
        <StatCard label="MUs" value={c.musCount} range={ranges.musCount} heat="ramp" rank={c.musCountRank} total={total} />
        <StatCard label="Parties" value={c.partyCount} range={ranges.partyCount} heat="ramp" rank={c.partyCountRank} total={total} />
        <StatCard label="Allies" value={c.alliesCount} range={ranges.alliesCount} heat="ramp" rank={c.alliesCountRank} total={total} />
        <StatCard label="Wars" value={c.warsCount} range={ranges.warsCount} heat="invertMedian" rank={c.warsCountRank} total={total} />
        <StatCard label="Unrest" value={c.unrestPercent} display={c.unrestPercent != null ? `${c.unrestPercent.toFixed(1)}%` : undefined} range={ranges.unrestPercent} heat="invert" />
        <StatCard label="Income Tax" value={c.taxIncome} display={c.taxIncome != null ? `${c.taxIncome}%` : undefined} range={ranges.taxIncome} heat="invert" center={10} />
        <StatCard label="Market Tax" value={c.taxMarket} display={c.taxMarket != null ? `${c.taxMarket}%` : undefined} range={ranges.taxMarket} heat="invert" />
        <StatCard label="Gems Bought" value={c.gemsPurchasedTotal} range={ranges.gemsPurchasedTotal} heat="ramp" rank={c.gemsPurchasedTotalRank} total={total} />
        <StatCard label="Premium Months" value={c.premiumMonthsTotal} range={ranges.premiumMonthsTotal} heat="ramp" rank={c.premiumMonthsTotalRank} total={total} />
        <StatCard label="Premium Gifts" value={c.premiumGiftsTotal} range={ranges.premiumGiftsTotal} heat="ramp" rank={c.premiumGiftsTotalRank} total={total} />
      </StatCardGrid>

      <CountryTables
        code={c.code}
        citizens={citizenPage}
        mus={muPage}
        parties={partyPage}
        battles={battlePage}
      />
    </main>
  )
}
