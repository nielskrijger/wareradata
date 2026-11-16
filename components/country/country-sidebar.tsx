import type { Range } from '@/lib/query'
import type { ActiveBattleSummary, CountryRow, StrategicBonusRow } from '@/lib/rows'

import { BattleCountBadge } from '@/components/badges/battle-count-badge'
import { TierBadge } from '@/components/badges/tier-badge'
import { HeatCell } from '@/components/data-table/heat-cell'
import { DetailSidebar, Fact, SidebarIdentity, SidebarSection } from '@/components/detail/detail-sidebar'
import { emblemRing } from '@/components/detail/emblem-ring'
import { GroupCondition } from '@/components/detail/group-condition'
import { SectionHeading } from '@/components/detail/section-heading'
import { StrategicBonusSection } from '@/components/detail/strategic-bonus-section'
import { EmptyDash } from '@/components/empty-dash'
import { Flag } from '@/components/flag'
import { InternalLink } from '@/components/links'
import { formatDecimal, formatNumber } from '@/lib/format'
import { formatGovType } from '@/lib/warera/gov-type'

interface Props {
  country: CountryRow
  citizenCount: number
  ranges: Record<string, Range>
  activeBattles: { count: number, list: ActiveBattleSummary[] }
  strategicBonus: StrategicBonusRow | null
}

/**
 * The country page's left column: who the country is and its policies, then
 * its citizens' condition and resource bonuses. Everything ranked lives in the
 * rank map.
 */
export function CountrySidebar({ country: c, citizenCount, ranges, activeBattles, strategicBonus }: Props) {
  return (
    <DetailSidebar
      // Flags are too busy to wash from, so a neutral wash stands in.
      wash="var(--muted)"
      avatar={(
        <Flag
          code={c.code}
          className="rounded-md"
          style={{ width: 88, height: 66, backgroundSize: 'cover', boxShadow: emblemRing() }}
        />
      )}
    >
      <SidebarIdentity
        name={c.name}
        badges={c.damageTier && <TierBadge tier={c.damageTier} />}
        kind="country"
        id={c.id}
      >
        <Fact label="Citizens">{formatNumber(citizenCount)}</Fact>
        <Fact label="MUs">{formatNumber(c.musCount)}</Fact>
        <Fact label="Parties">{formatNumber(c.partyCount)}</Fact>
        <Fact label="Government">{c.govType ? formatGovType(c.govType) : <EmptyDash />}</Fact>
        <Fact label="Alliance">
          {c.allianceId && c.allianceName
            ? <InternalLink href={`/alliances/${c.allianceId}`} className="truncate">{c.allianceName}</InternalLink>
            : <EmptyDash />}
        </Fact>
        <Fact label="Battles">
          <BattleCountBadge count={activeBattles.count} countryId={c.id} battles={activeBattles.list} />
        </Fact>
      </SidebarIdentity>

      <SidebarSection>
        <SectionHeading title="Policies" />
        <dl className="space-y-1 text-sm">
          <Policy label="Income tax" value={c.taxIncome} range={ranges.taxIncome} center={10} />
          <Policy label="Market tax" value={c.taxMarket} range={ranges.taxMarket} />
          <Policy label="Manager tax" value={c.taxManager} range={ranges.taxManager} />
          <Policy label="Unrest" value={c.unrestPercent} range={ranges.unrestPercent} decimals={1} />
        </dl>
      </SidebarSection>

      <GroupCondition row={c} />
      <StrategicBonusSection bonus={strategicBonus} scope="country" />
    </DetailSidebar>
  )
}

/**
 * A percentage policy, tinted so lower reads better.
 */
function Policy({ label, value, range, center, decimals }: {
  label: string
  value: number | null
  range: Range | undefined
  center?: number
  decimals?: number
}) {
  return (
    <Fact label={label}>
      {value == null ? <EmptyDash /> : (
        <HeatCell value={value} range={range} mode="invert" center={center}>
          {`${decimals ? formatDecimal(value, decimals) : value}%`}
        </HeatCell>
      )}
    </Fact>
  )
}
