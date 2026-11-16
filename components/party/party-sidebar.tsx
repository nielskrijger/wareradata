import type { PartyRow } from '@/lib/rows'

import { Avatar } from '@/components/avatar'
import { CountryCell } from '@/components/cells/country-cell'
import { LeaderCell } from '@/components/cells/leader-cell'
import { DetailSidebar, Fact, SidebarIdentity } from '@/components/detail/detail-sidebar'
import { emblemRing } from '@/components/detail/emblem-ring'
import { EmptyDash } from '@/components/empty-dash'
import { formatDate, formatNumber } from '@/lib/format'

/**
 * The party page's left column: who the party is. Everything ranked lives in
 * the rank map instead.
 */
export function PartySidebar({ party: p }: { party: PartyRow }) {
  return (
    <DetailSidebar
      // Parties have no colour scheme, so a neutral wash stands in for the profile's.
      wash="var(--muted)"
      avatar={<Avatar src={p.avatarUrl} name={p.name} size={88} style={{ boxShadow: emblemRing() }} />}
    >
      <SidebarIdentity name={p.name} kind="party" id={p.id}>
        <Fact label="Country">
          <CountryCell countryCode={p.countryCode} countryName={p.countryName} countryId={p.countryId} />
        </Fact>
        <Fact label="Leader">{p.leaderName ? <LeaderCell leader={p} /> : <EmptyDash />}</Fact>
        <Fact label="Members">{formatNumber(p.memberCount)}</Fact>
        <Fact label="Founded">{p.createdAt ? formatDate(p.createdAt) : <EmptyDash />}</Fact>
      </SidebarIdentity>
    </DetailSidebar>
  )
}
