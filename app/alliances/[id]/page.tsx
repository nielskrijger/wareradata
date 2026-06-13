import type { Metadata } from 'next'

import type { AllianceRow } from '@/lib/rows'

import { notFound } from 'next/navigation'
import { connection } from 'next/server'

import { UsersTable } from '@/app/users/users-table'
import { TierBadge } from '@/components/badges/tier-badge'
import { AllianceAvatar } from '@/components/cells/alliance-avatar'
import { CompactNumber } from '@/components/cells/compact-number'
import { UserNameCell } from '@/components/cells/user-name-cell'
import { DetailHeader, FactRow } from '@/components/detail/detail-header'
import { MultiStatCard } from '@/components/detail/multi-stat-card'
import { StatCardGrid } from '@/components/detail/stat-card-grid'
import { ExternalLink } from '@/components/links'
import { getSnapshot } from '@/lib/cache/memory'
import { computeRanges, firstPage } from '@/lib/query'
import { schemeRgb } from '@/lib/warera/color-schemes'
import { wareraUrl } from '@/lib/warera/urls'

import { MembersTable } from './members-table'

interface PageProps {
  params: Promise<{ id: string }>
}

async function getAlliance(id: string) {
  const { alliances, users } = await getSnapshot()
  const alliance = alliances.find(a => a.id === id)
  if (!alliance) {
    return null
  }

  // Ranges over all alliances, same as the /alliances table, so each stat can
  // show where this alliance sits.
  const ranges = computeRanges(alliances)
  const total = alliances.length

  // Citizens of all member countries, the alliance-wide equivalent of the
  // country page's citizens tab.
  const memberCodes = new Set(alliance.members.map(m => m.code).filter(Boolean))
  const citizenPage = firstPage(
    users.filter(u => u.countryCode !== null && memberCodes.has(u.countryCode)),
    'points',
  )

  return { alliance, ranges, total, citizenPage }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const result = await getAlliance(id)
  if (!result) {
    return { title: 'Alliance not found' }
  }
  return {
    title: result.alliance.name,
    description: `WarEra.io alliance stats for ${result.alliance.name}.`,
  }
}

interface EmblemProps {
  alliance: AllianceRow
}

/**
 * The header emblem: the shared alliance logo/monogram with the standard
 * card+border ring pulled up over the banner.
 */
function AllianceEmblem({ alliance: a }: EmblemProps) {
  return (
    <AllianceAvatar
      name={a.name}
      avatarUrl={a.avatarUrl}
      scheme={a.scheme}
      size={64}
      className="-mt-9"
      style={{ boxShadow: '0 0 0 4px var(--card), 0 0 0 5px var(--border)' }}
    />
  )
}

export default async function AllianceDetailPage({ params }: PageProps) {
  await connection()
  const { id } = await params
  const result = await getAlliance(id)
  if (!result) {
    notFound()
  }
  const { alliance: a, ranges, total, citizenPage } = result
  const rgb = schemeRgb(a.scheme)

  // The user's filter on the citizens table is applied within this scope, so a
  // search can never widen past the alliance's member countries.
  const memberCodes = a.members.map(m => m.code).filter((code): code is string => code !== null)
  const citizensBaseFilter = `(${memberCodes.map(code => `countryCode:${code}`).join(' OR ')})`

  return (
    <main className="space-y-3 px-6 py-8 sm:px-8 lg:px-12">
      <DetailHeader
        title={a.name}
        titleSuffix={a.developmentTier ? <TierBadge tier={a.developmentTier} /> : undefined}
        bannerStyle={{ background: `linear-gradient(100deg, rgba(${rgb}, 0.38), rgba(${rgb}, 0.06))` }}
        emblem={<AllianceEmblem alliance={a} />}
      >
        <FactRow>
          <UserNameCell
            userId={a.leaderId}
            name={a.leaderName}
            avatarUrl={a.leaderAvatarUrl}
            colorScheme={a.leaderColorScheme}
          />
          <span className="text-muted-foreground">
            <span className="text-foreground font-medium">{a.memberCount}</span>
            {' '}
            countries
          </span>
          <span className="text-muted-foreground">
            <span className="text-foreground font-medium">{citizenPage.total.toLocaleString()}</span>
            {' '}
            citizens
          </span>
          {a.createdAt && (
            <span className="text-muted-foreground">
              founded
              {' '}
              {a.createdAt.slice(0, 10)}
            </span>
          )}
          <ExternalLink href={wareraUrl('alliance', a.id)}>WarEra.io</ExternalLink>
        </FactRow>
      </DetailHeader>

      <StatCardGrid>
        <MultiStatCard
          label="Development"
          total={total}
          rows={[
            { label: 'Current', value: a.development, display: a.development !== null ? a.development.toFixed(1) : undefined, range: ranges.development, heat: 'median', rank: a.developmentRank },
            { label: 'Core', value: a.coreDevelopment, display: a.coreDevelopment !== null ? a.coreDevelopment.toFixed(1) : undefined, range: ranges.coreDevelopment, heat: 'median', rank: a.coreDevelopmentRank },
            { label: 'Average', value: a.averageDevelopment, display: a.averageDevelopment !== null ? a.averageDevelopment.toFixed(1) : undefined, range: ranges.averageDevelopment, heat: 'median', rank: a.averageDevelopmentRank },
          ]}
        />
        <MultiStatCard
          label="Damage"
          total={total}
          rows={[
            { label: 'Total', value: a.damage, display: <CompactNumber value={a.damage} />, range: ranges.damage, heat: 'median', rank: a.damageRank },
            { label: 'Weekly', value: a.weeklyDamage, display: <CompactNumber value={a.weeklyDamage} />, range: ranges.weeklyDamage, heat: 'median', rank: a.weeklyDamageRank },
            { label: 'Per citizen', value: a.weeklyDamagePerCitizen, display: <CompactNumber value={a.weeklyDamagePerCitizen} />, range: ranges.weeklyDamagePerCitizen, heat: 'median', rank: a.weeklyDamagePerCitizenRank },
          ]}
        />
      </StatCardGrid>

      <section className="space-y-3 pt-3">
        <h2 className="font-brand text-lg tracking-wide">Member countries</h2>
        <MembersTable alliance={a} />
      </section>

      <section className="space-y-3 pt-3">
        <h2 className="font-brand text-lg tracking-wide">Citizens</h2>
        <UsersTable initial={citizenPage} baseFilter={citizensBaseFilter} />
      </section>
    </main>
  )
}
