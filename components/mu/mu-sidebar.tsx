import type { ReactNode } from 'react'
import type { MURow } from '@/lib/rows'

import { Avatar } from '@/components/avatar'
import { CombatModeBadge } from '@/components/badges/combat-mode-badge'
import { TierBadge } from '@/components/badges/tier-badge'
import { CountryCell } from '@/components/cells/country-cell'
import { LeaderCell } from '@/components/cells/leader-cell'
import { LeanSplit } from '@/components/detail/combat-mode-card'
import { DetailSidebar, Fact, SidebarSection, SidebarTitle } from '@/components/detail/detail-sidebar'
import { SectionHeading } from '@/components/detail/section-heading'
import { VitalRows } from '@/components/detail/vitals-card'
import { EmptyDash } from '@/components/empty-dash'
import { ExternalLink } from '@/components/links'
import { ReadinessRows } from '@/components/readiness-pill-card'
import { formatNumber } from '@/lib/format'
import { classifyWarShare } from '@/lib/skills/classify'
import { wareraUrl } from '@/lib/warera/urls'

/**
 * The MU page's left column: who the MU is, then its members' condition.
 * Everything ranked lives in the rank map instead.
 */
export function MUSidebar({ mu, refresh }: { mu: MURow, refresh: ReactNode }) {
  const { buff, ready, debuff } = mu.readinessPill

  return (
    <DetailSidebar
      // MUs have no colour scheme, so a neutral wash stands in for the profile's.
      wash="var(--muted)"
      avatar={(
        <Avatar
          src={mu.avatarUrl}
          name={mu.name}
          size={88}
          style={{ boxShadow: '0 0 0 3px var(--card), 0 0 0 4px var(--border)' }}
        />
      )}
      refresh={refresh}
    >
      <div className="space-y-3">
        <SidebarTitle name={mu.name}>
          {mu.damageTier && <TierBadge tier={mu.damageTier} />}
        </SidebarTitle>

        <dl className="space-y-1 text-sm">
          <Fact label="Country">
            <CountryCell countryCode={mu.countryCode} countryName={mu.countryName} countryId={mu.countryId} />
          </Fact>
          <Fact label="Region">{mu.regionName ?? <EmptyDash />}</Fact>
          <Fact label="Leader">
            {mu.leaderName ? <LeaderCell leader={mu} /> : <EmptyDash />}
          </Fact>
          <Fact label="Members">{formatNumber(mu.memberCount)}</Fact>
          <Fact label="Headquarters"><Level value={mu.headquartersLevel} /></Fact>
          <Fact label="Dormitories"><Level value={mu.dormitoriesLevel} /></Fact>
        </dl>

        <ExternalLink href={wareraUrl('mu', mu.id)}>WarEra.io</ExternalLink>
      </div>

      {buff + ready + debuff > 0 && (
        <SidebarSection>
          <SectionHeading title="Readiness" />
          <ReadinessRows mix={mu.readinessPill} />
        </SidebarSection>
      )}

      {(mu.avgHealth != null || mu.avgHunger != null) && (
        <SidebarSection>
          <SectionHeading
            title="Vitals"
            aside={<span className="text-muted-foreground text-xs">member average</span>}
          />
          <VitalRows health={mu.avgHealth} hunger={mu.avgHunger} />
        </SidebarSection>
      )}

      <SidebarSection>
        <SectionHeading title="War / eco lean" aside={<CombatModeBadge mode={classifyWarShare(mu.avgWarShare)} />} />
        <LeanSplit avgWarShare={mu.avgWarShare} />
      </SidebarSection>
    </DetailSidebar>
  )
}

function Level({ value }: { value: number | null }) {
  return value == null ? <EmptyDash /> : `Level ${value}`
}
