import type { ReactNode } from 'react'
import type { MURow } from '@/lib/rows'

import { Avatar } from '@/components/avatar'
import { TierBadge } from '@/components/badges/tier-badge'
import { CountryCell } from '@/components/cells/country-cell'
import { LeaderCell } from '@/components/cells/leader-cell'
import { DetailSidebar, Fact, SidebarIdentity } from '@/components/detail/detail-sidebar'
import { emblemRing } from '@/components/detail/emblem-ring'
import { GroupCondition } from '@/components/detail/group-condition'
import { EmptyDash } from '@/components/empty-dash'
import { formatNumber } from '@/lib/format'

/**
 * The MU page's left column: who the MU is, then its members' condition.
 * Everything ranked lives in the rank map instead.
 */
export function MUSidebar({ mu, refresh }: { mu: MURow, refresh: ReactNode }) {
  return (
    <DetailSidebar
      // MUs have no colour scheme, so a neutral wash stands in for the profile's.
      wash="var(--muted)"
      avatar={<Avatar src={mu.avatarUrl} name={mu.name} size={88} style={{ boxShadow: emblemRing() }} />}
      refresh={refresh}
    >
      <SidebarIdentity
        name={mu.name}
        badges={mu.damageTier && <TierBadge tier={mu.damageTier} />}
        kind="mu"
        id={mu.id}
      >
        <Fact label="Country">
          <CountryCell countryCode={mu.countryCode} countryName={mu.countryName} countryId={mu.countryId} />
        </Fact>
        <Fact label="Region">{mu.regionName ?? <EmptyDash />}</Fact>
        <Fact label="Leader">{mu.leaderName ? <LeaderCell leader={mu} /> : <EmptyDash />}</Fact>
        <Fact label="Members">{formatNumber(mu.memberCount)}</Fact>
        <Fact label="Headquarters"><Level value={mu.headquartersLevel} /></Fact>
        <Fact label="Dormitories"><Level value={mu.dormitoriesLevel} /></Fact>
      </SidebarIdentity>

      <GroupCondition row={mu} />
    </DetailSidebar>
  )
}

function Level({ value }: { value: number | null }) {
  return value == null ? <EmptyDash /> : `Level ${value}`
}
