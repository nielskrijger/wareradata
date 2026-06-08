import type { Metadata } from 'next'

import { notFound } from 'next/navigation'
import { connection } from 'next/server'

import { BattleCountBadge } from '@/components/badges/battle-count-badge'
import { TierBadge } from '@/components/badges/tier-badge'
import { CompactNumber } from '@/components/cells/compact-number'
import { CombatModeCard } from '@/components/detail/combat-mode-card'
import { DetailHeader, FactRow } from '@/components/detail/detail-header'
import { GovernmentSection } from '@/components/detail/government-section'
import { MultiStatCard } from '@/components/detail/multi-stat-card'
import { PointsBreakdownPanel } from '@/components/detail/points-breakdown-panel'
import { StatCardGrid } from '@/components/detail/stat-card-grid'
import { VitalsCard } from '@/components/detail/vitals-card'
import { WealthCompositionCard } from '@/components/detail/wealth-composition-card'
import { Flag } from '@/components/flag'
import { ExternalLink } from '@/components/links'
import { ReadinessPillCard } from '@/components/readiness-pill-card'
import { getActiveBattlesByCountry, getLiveActiveBattles } from '@/lib/cache/live-battles'
import { getSnapshot } from '@/lib/cache/memory'
import { applyQuery, DEFAULT_PAGE_SIZE } from '@/lib/query'
import { wareraUrl } from '@/lib/warera/urls'

import { CountryTables } from './country-tables'

interface PageProps {
  params: Promise<{ id: string }>
}

async function getCountry(id: string) {
  const [{ countries, users, mus, parties, governments }, liveActive, activeBattlesByCountry] = await Promise.all([
    getSnapshot(),
    getLiveActiveBattles(),
    getActiveBattlesByCountry(),
  ])
  const country = countries.find(c => c.id === id)
  if (!country) {
    return null
  }

  const government = governments[id] ?? null

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

  // The matchup list for this country's ⚔ pill tooltip, same shape the table
  // cell uses (each battle from this country's point of view).
  const activeBattlesList = activeBattlesByCountry.get(id) ?? []

  return { country, government, ranges: ranges ?? {}, total, citizenPage, muPage, partyPage, battlePage, activeBattlesList }
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
  await connection()
  const { id } = await params
  const result = await getCountry(id)
  if (!result) {
    notFound()
  }
  const { country: c, government, ranges, total, citizenPage, muPage, partyPage, battlePage, activeBattlesList } = result

  return (
    <main className="space-y-3 px-6 py-8 sm:px-8 lg:px-12">
      <DetailHeader
        title={c.name}
        titleSuffix={c.damageTier ? <TierBadge tier={c.damageTier} /> : undefined}
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
          <BattleCountBadge count={battlePage.total} countryId={c.id} battles={activeBattlesList} />
          <ExternalLink href={wareraUrl('country', c.id)}>WarEra.io</ExternalLink>
        </FactRow>
      </DetailHeader>

      <StatCardGrid>
        <PointsBreakdownPanel
          className="sm:col-span-2"
          total={c.totalPoints}
          level={c.levelPoints}
          damage={c.damagePoints}
          wealth={c.wealthPoints}
          caption={{ value: c.avgPoints, unit: 'points/citizen' }}
        />
        <ReadinessPillCard mix={c.readinessPill} />
        <CombatModeCard avgWarShare={c.avgWarShare} rank={c.avgWarShareRank} total={total} />
        <VitalsCard average health={c.avgHealth} hunger={c.avgHunger} />
        <MultiStatCard
          label="Damage"
          total={total}
          hero={{ label: 'Total', value: c.damage, display: <CompactNumber value={c.damage} />, range: ranges.damage, heat: 'median', rank: c.damageRank }}
          rows={[
            { label: 'Weekly', value: c.weeklyDamage, display: <CompactNumber value={c.weeklyDamage} />, range: ranges.weeklyDamage, heat: 'median', rank: c.weeklyDamageRank },
            { label: 'Per citizen', value: c.weeklyDamagePerCitizen, display: <CompactNumber value={c.weeklyDamagePerCitizen} />, range: ranges.weeklyDamagePerCitizen, heat: 'median', rank: c.weeklyDamagePerCitizenRank },
            { label: 'Avg gear', value: c.avgGearScore, range: ranges.avgGearScore, heat: 'median', rank: c.avgGearScoreRank },
          ]}
        />
        <MultiStatCard
          label="Economy"
          rows={[
            { label: 'Treasury', value: c.money, display: <CompactNumber value={c.money} />, range: ranges.money, heat: 'median', rank: c.moneyRank },
            { label: 'Country Wealth', value: c.wealth, display: <CompactNumber value={c.wealth} />, range: ranges.wealth, heat: 'median', rank: c.wealthRank },
            { label: 'Citizen Wealth', value: c.citizenWealth, display: <CompactNumber value={c.citizenWealth} />, range: ranges.citizenWealth, heat: 'median', rank: c.citizenWealthRank },
            { label: 'Bounty', value: c.bounty, display: <CompactNumber value={c.bounty} />, range: ranges.bounty, heat: 'ramp', rank: c.bountyRank },
            { label: 'Development', value: c.development, range: ranges.development, heat: 'median', rank: c.developmentRank },
            { label: 'Prod. bonus', value: c.productionBonus, display: c.productionBonus != null ? `${c.productionBonus}%` : undefined, range: ranges.productionBonus, heat: 'median', rank: c.productionBonusRank },
          ]}
        />
        <WealthCompositionCard
          perCapita={{ count: citizenPage.total, unit: 'citizen' }}
          parts={[
            { label: 'Companies', value: c.companiesWealth, range: ranges.companiesWealth, rank: c.companiesWealthRank },
            { label: 'Items', value: c.itemsWealth, range: ranges.itemsWealth, rank: c.itemsWealthRank },
            { label: 'Cash', value: c.cashWealth, range: ranges.cashWealth, rank: c.cashWealthRank },
            { label: 'Equipment', value: c.equipmentWealth, range: ranges.equipmentWealth, rank: c.equipmentWealthRank },
            { label: 'Weapons', value: c.weaponsWealth, range: ranges.weaponsWealth, rank: c.weaponsWealthRank },
          ]}
        />
        <MultiStatCard
          label="Society"
          rows={[
            { label: 'Active pop.', value: c.activePopulation, range: ranges.activePopulation, heat: 'ramp', rank: c.activePopulationRank },
            { label: 'Avg level', value: c.avgLevel, range: ranges.avgLevel, heat: 'median', rank: c.avgLevelRank },
            { label: 'MUs', value: c.musCount, range: ranges.musCount, heat: 'ramp', rank: c.musCountRank },
            { label: 'Parties', value: c.partyCount, range: ranges.partyCount, heat: 'ramp', rank: c.partyCountRank },
          ]}
        />
        <MultiStatCard
          label="Relations"
          rows={[
            { label: 'Allies', value: c.alliesCount, range: ranges.alliesCount, heat: 'ramp', rank: c.alliesCountRank },
            { label: 'Wars', value: c.warsCount, range: ranges.warsCount, heat: 'invertMedian', rank: c.warsCountRank },
          ]}
        />
        <MultiStatCard
          label="Policies"
          rows={[
            { label: 'Income tax', value: c.taxIncome, display: c.taxIncome != null ? `${c.taxIncome}%` : undefined, range: ranges.taxIncome, heat: 'invert', center: 10 },
            { label: 'Market tax', value: c.taxMarket, display: c.taxMarket != null ? `${c.taxMarket}%` : undefined, range: ranges.taxMarket, heat: 'invert' },
            { label: 'Self-work tax', value: c.taxSelfWork, display: c.taxSelfWork != null ? `${c.taxSelfWork}%` : undefined, range: ranges.taxSelfWork, heat: 'invert', center: 5 },
            { label: 'Unrest', value: c.unrestPercent, display: c.unrestPercent != null ? `${c.unrestPercent.toFixed(1)}%` : undefined, range: ranges.unrestPercent, heat: 'invert' },
          ]}
        />
        <MultiStatCard
          label="Premium"
          rows={[
            { label: 'Gems bought', value: c.gemsPurchasedTotal, display: <CompactNumber value={c.gemsPurchasedTotal} />, range: ranges.gemsPurchasedTotal, heat: 'ramp', rank: c.gemsPurchasedTotalRank },
            { label: 'Months', value: c.premiumMonthsTotal, range: ranges.premiumMonthsTotal, heat: 'ramp', rank: c.premiumMonthsTotalRank },
            { label: 'Gifts', value: c.premiumGiftsTotal, range: ranges.premiumGiftsTotal, heat: 'ramp', rank: c.premiumGiftsTotalRank },
          ]}
        />
      </StatCardGrid>

      <GovernmentSection government={government} />

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
