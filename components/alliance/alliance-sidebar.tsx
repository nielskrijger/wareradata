import type { AllianceRow, StrategicBonusRow } from '@/lib/rows'

import { TierBadge } from '@/components/badges/tier-badge'
import { AllianceAvatar } from '@/components/cells/alliance-avatar'
import { LeaderCell } from '@/components/cells/leader-cell'
import { DetailSidebar, Fact, SidebarIdentity } from '@/components/detail/detail-sidebar'
import { emblemRing } from '@/components/detail/emblem-ring'
import { GroupCondition } from '@/components/detail/group-condition'
import { StrategicBonusSection } from '@/components/detail/strategic-bonus-section'
import { EmptyDash } from '@/components/empty-dash'
import { formatDate, formatNumber } from '@/lib/format'
import { schemeRgb } from '@/lib/warera/color-schemes'

interface Props {
  alliance: AllianceRow
  citizenCount: number
  strategicBonus: StrategicBonusRow | null
}

/**
 * The alliance page's left column: who the alliance is, then its citizens'
 * condition and resource bonuses. Everything ranked lives in the rank map.
 */
export function AllianceSidebar({ alliance: a, citizenCount, strategicBonus }: Props) {
  const rgb = schemeRgb(a.scheme)

  return (
    <DetailSidebar
      // The alliance's colour scheme, faded out behind the logo.
      wash={`rgba(${rgb}, 0.22)`}
      avatar={(
        <AllianceAvatar
          name={a.name}
          avatarUrl={a.avatarUrl}
          scheme={a.scheme}
          size={88}
          style={{ boxShadow: emblemRing(`rgb(${rgb})`) }}
        />
      )}
    >
      <SidebarIdentity
        name={a.name}
        badges={a.developmentTier && <TierBadge tier={a.developmentTier} />}
        kind="alliance"
        id={a.id}
      >
        <Fact label="Leader">{a.leaderName ? <LeaderCell leader={a} /> : <EmptyDash />}</Fact>
        <Fact label="Countries">{formatNumber(a.memberCount)}</Fact>
        <Fact label="Citizens">{formatNumber(citizenCount)}</Fact>
        <Fact label="Founded">{a.createdAt ? formatDate(a.createdAt) : <EmptyDash />}</Fact>
      </SidebarIdentity>

      <GroupCondition row={a} />
      <StrategicBonusSection bonus={strategicBonus} scope="alliance" />
    </DetailSidebar>
  )
}
