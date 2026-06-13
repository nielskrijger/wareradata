import type { Metadata } from 'next'

import { Clock } from 'lucide-react'
import { notFound } from 'next/navigation'
import { connection } from 'next/server'
import { Suspense } from 'react'

import { Avatar } from '@/components/avatar'
import { ReadinessBadge } from '@/components/badges/readiness-badge'
import { TierBadge } from '@/components/badges/tier-badge'
import { CompactNumber } from '@/components/cells/compact-number'
import { CountryCell } from '@/components/cells/country-cell'
import { MUCell } from '@/components/cells/mu-cell'
import { PartyCell } from '@/components/cells/party-cell'
import { CasesCard } from '@/components/detail/cases-card'
import { DetailHeader, FactRow } from '@/components/detail/detail-header'
import { GearBand } from '@/components/detail/gear-band'
import { MultiStatCard } from '@/components/detail/multi-stat-card'
import { PointsBreakdownPanel } from '@/components/detail/points-breakdown-panel'
import { RefreshButton } from '@/components/detail/refresh-button'
import { SkillSplitCard } from '@/components/detail/skill-split-card'
import { StatCardGrid } from '@/components/detail/stat-card-grid'
import { VitalsCard } from '@/components/detail/vitals-card'
import { WealthCompositionCard } from '@/components/detail/wealth-composition-card'
import { FactoriesSection } from '@/components/factories/factories-section'
import { ExternalLink } from '@/components/links'
import { RelativeTime } from '@/components/relative-time'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { loadUserEquipment } from '@/lib/cache/equipment-store'
import { getSnapshot } from '@/lib/cache/memory'
import { casesBreakdownFromRow } from '@/lib/cases'
import { EMPTY } from '@/lib/format'
import { computeRanges } from '@/lib/query'
import { getUserCasesBreakdown } from '@/lib/warera/api'
import { schemeRgb } from '@/lib/warera/color-schemes'
import { wareraUrl } from '@/lib/warera/urls'

import { requestUserRefresh } from './actions'

interface PageProps {
  params: Promise<{ id: string }>
}

async function getUser(id: string) {
  const { users, gearLookup } = await getSnapshot()
  const user = users.find(u => u.id === id)
  if (!user) {
    return null
  }
  // Ranges over the full ranked set, same as the table, so each stat can show
  // where this player sits.
  const ranges = computeRanges(users)

  return { user, ranges, total: users.length, gearLookup }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const result = await getUser(id)
  if (!result) {
    return { title: 'User not found' }
  }
  return {
    title: result.user.username,
    description: `WarEra.io stats for ${result.user.username}.`,
  }
}

export default async function UserDetailPage({ params }: PageProps) {
  await connection()
  const { id } = await params
  const result = await getUser(id)
  if (!result) {
    notFound()
  }
  const { user, ranges, total, gearLookup } = result

  // The per-rarity case breakdown now rides along in the snapshot (users are
  // scraped via getUserById). Fall back to a live fetch only for rows a fresh
  // scrape hasn't reached yet, and skip it entirely when there are no cases.
  const cases = casesBreakdownFromRow(user) ?? (user.casesOpened ? await getUserCasesBreakdown(user.id) : null)

  const rgb = schemeRgb(user.colorScheme)
  // Show the gear section whenever we captured this user's equipment, even if
  // they're wearing nothing (score 0) — the empty placeholder slots make "not
  // equipped" legible. A null score means we never scraped their gear, so the
  // section stays hidden rather than implying an empty loadout.
  const hasGearData = user.gearScore != null

  // The full loadout lives in a separate equipment file (not the snapshot), so
  // read just this user's line, and only when there's a gear section to fill.
  const equipment = hasGearData ? (await loadUserEquipment(user.id)) ?? undefined : undefined

  return (
    <main className="space-y-3 px-6 py-8 sm:px-8 lg:px-12">
      <DetailHeader
        title={user.username}
        aside={<RefreshButton id={user.id} action={requestUserRefresh} lastRefreshedAt={user.lastRefreshedAt} />}
        titleSuffix={(
          <>
            {user.levelTier && <TierBadge tier={user.levelTier} />}
            {user.readinessStatus != null && <ReadinessBadge status={user.readinessStatus} endsAt={user.readinessEndsAt} />}
          </>
        )}
        bannerStyle={{ background: `linear-gradient(100deg, rgba(${rgb}, 0.38), rgba(${rgb}, 0.06))` }}
        emblem={(
          <Avatar
            src={user.avatarUrl}
            name={user.username}
            size={64}
            className="-mt-9"
            style={{ boxShadow: `0 0 0 4px var(--card), 0 0 0 5px rgb(${rgb})` }}
          />
        )}
        footer={hasGearData ? <GearBand score={user.gearScore} equipment={equipment} gearLookup={gearLookup} /> : undefined}
      >
        <FactRow>
          <CountryCell countryCode={user.countryCode} countryName={user.countryName} countryId={user.countryId} />
          {user.level != null && (
            <Tooltip>
              <TooltipTrigger render={<span className="text-muted-foreground hover:text-foreground cursor-default" />}>
                Level <span className="text-foreground font-medium">{user.level}</span>
              </TooltipTrigger>
              <TooltipContent side="top">
                {user.levelRank != null
                  ? `Rank #${user.levelRank.toLocaleString()} of ${total.toLocaleString()}`
                  : 'Unranked'}
              </TooltipContent>
            </Tooltip>
          )}
          {user.isBanned && (
            <Badge className="bg-red-500/15 text-red-900 dark:text-red-300">banned</Badge>
          )}
          <ExternalLink href={wareraUrl('user', user.id)}>WarEra.io</ExternalLink>
        </FactRow>
        <FactRow muted>
          {user.muName && (
            <span className="inline-flex items-center gap-1">MU <MUCell muName={user.muName} muId={user.muId} /></span>
          )}
          {user.partyName && (
            <span className="inline-flex max-w-[16rem] items-center gap-1">Party <PartyCell partyName={user.partyName} partyId={user.partyId} /></span>
          )}
          <span>Joined {user.createdAt?.slice(0, 10) ?? EMPTY}</span>
          <Tooltip>
            <TooltipTrigger render={<span className="inline-flex items-center gap-1 hover:text-foreground cursor-default" />}>
              <Clock className="size-3.5 shrink-0" />
              <RelativeTime iso={user.lastConnectionAt} />
            </TooltipTrigger>
            <TooltipContent side="top">Last seen</TooltipContent>
          </Tooltip>
        </FactRow>
      </DetailHeader>

      <StatCardGrid>
        <PointsBreakdownPanel
          className="sm:col-span-2"
          total={user.points}
          level={user.levelPoints}
          damage={user.damagePoints}
          wealth={user.wealthPoints}
          caption={{ value: user.pointsPerDay, unit: 'points/day' }}
        />
        <VitalsCard health={user.health} hunger={user.hunger} />
        <SkillSplitCard
          mode={user.combatMode}
          warPoints={user.warPoints}
          ecoPoints={user.ecoPoints}
          warPointsRank={user.warPointsRank}
          ecoPointsRank={user.ecoPointsRank}
        />
        <MultiStatCard
          label="Damage"
          total={total}
          hero={{ label: 'Total', value: user.damage, display: <CompactNumber value={user.damage} />, range: ranges.damage, heat: 'median', rank: user.damageRank }}
          rows={[
            { label: 'Weekly', value: user.weeklyDamage, display: <CompactNumber value={user.weeklyDamage} />, range: ranges.weeklyDamage, heat: 'median', rank: user.weeklyDamageRank },
            { label: 'Military rank', value: user.militaryRank, range: ranges.militaryRank, heat: 'median', rank: user.militaryRankPos },
            { label: 'Terrain', value: user.terrain, range: ranges.terrain, heat: 'median', rank: user.terrainRank },
          ]}
        />
        <MultiStatCard
          label="Economy"
          rows={[
            { label: 'Wealth', value: user.wealth, display: <CompactNumber value={user.wealth} />, range: ranges.wealth, heat: 'median', rank: user.wealthRank },
            { label: 'Bounty', value: user.bounty, display: <CompactNumber value={user.bounty} />, range: ranges.bounty, heat: 'median', rank: user.bountyRank },
            { label: 'Referrals', value: user.referrals, range: ranges.referrals, heat: 'ramp', rank: user.referralsRank },
          ]}
        />
        <WealthCompositionCard
          parts={[
            { label: 'Companies', value: user.companiesWealth, range: ranges.companiesWealth, rank: user.companiesWealthRank },
            { label: 'Items', value: user.itemsWealth, range: ranges.itemsWealth, rank: user.itemsWealthRank },
            { label: 'Cash', value: user.cashWealth, range: ranges.cashWealth, rank: user.cashWealthRank },
            { label: 'Equipment', value: user.equipmentWealth, range: ranges.equipmentWealth, rank: user.equipmentWealthRank },
            { label: 'Weapons', value: user.weaponsWealth, range: ranges.weaponsWealth, rank: user.weaponsWealthRank },
          ]}
        />
        <CasesCard
          total={user.casesOpened}
          rank={user.casesOpenedRank}
          rankOf={total}
          breakdown={cases}
        />
        <MultiStatCard
          label="Premium"
          rows={[
            { label: 'Gems bought', value: user.gemsPurchased, display: <CompactNumber value={user.gemsPurchased} />, range: ranges.gemsPurchased, heat: 'ramp', rank: user.gemsPurchasedRank },
            { label: 'Months', value: user.premiumMonths, range: ranges.premiumMonths, heat: 'ramp', rank: user.premiumMonthsRank },
            { label: 'Gifts', value: user.premiumGifts, range: ranges.premiumGifts, heat: 'ramp', rank: user.premiumGiftsRank },
          ]}
        />
      </StatCardGrid>

      <Suspense fallback={<div className="bg-card text-muted-foreground rounded-md border p-3 text-sm">Loading factories…</div>}>
        <FactoriesSection userId={user.id} />
      </Suspense>
    </main>
  )
}
