import type { ReactNode } from 'react'

import type { BattleDetail, BattleRow, BattleSideKey, BattleSideStats } from '@/lib/rows'

import { BattleMatchup } from '@/components/battle/battle-matchup'
import { SideDot } from '@/components/battle/side-dot'
import { CompactNumber } from '@/components/cells/compact-number'
import { CountryCell } from '@/components/cells/country-cell'
import { GroupCell } from '@/components/cells/group-cell'
import { DetailSidebar, Fact, SidebarSection } from '@/components/detail/detail-sidebar'
import { SectionHeading } from '@/components/detail/section-heading'
import { EmptyDash } from '@/components/empty-dash'
import { ExternalLink } from '@/components/links'
import { RegionLink } from '@/components/region-link'
import { RelativeTime } from '@/components/relative-time'
import { Badge } from '@/components/ui/badge'
import { elapsedMs, formatDecimal, formatDuration, formatNumber } from '@/lib/format'
import { wareraUrl } from '@/lib/warera/urls'

const SIDES: BattleSideKey[] = ['attacker', 'defender']

/**
 * A dash for zero or missing, so an empty side doesn't read as a real 0.
 */
function orDash(value: number | null, render: (v: number) => ReactNode): ReactNode {
  return value ? render(value) : <EmptyDash />
}

const perHit = (s: BattleSideStats) => orDash(s.hits, hits => formatNumber(Math.round(s.damage / hits)))
const compact = (v: number) => <CompactNumber value={v} />
const perK = (v: number) => formatDecimal(v, 2)

/**
 * One stat with the attacker's value and the defender's side by side.
 */
function SideRow({ label, render, sides }: {
  label: string
  render: (s: BattleSideStats) => ReactNode
  sides: Record<BattleSideKey, BattleSideStats>
}) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      {SIDES.map(side => <dd key={side} className="text-right tabular-nums">{render(sides[side])}</dd>)}
    </>
  )
}

function SideStats({ battle: b, sides }: { battle: BattleRow, sides: Record<BattleSideKey, BattleSideStats> }) {
  const hasBounty = sides.attacker.moneyPool > 0 || sides.defender.moneyPool > 0

  return (
    <dl className="grid grid-cols-[1fr_auto_auto] gap-x-6 gap-y-1 text-sm">
      <span />
      {SIDES.map(side => (
        <span key={side} className="text-muted-foreground flex items-center justify-end gap-1.5 text-xs">
          <SideDot side={side} />
          <span className="max-w-20 truncate">{b[side].name ?? '?'}</span>
        </span>
      ))}
      <SideRow label="Fighters" sides={sides} render={s => formatNumber(s.fighters)} />
      <SideRow label="Hits" sides={sides} render={s => formatNumber(s.hits)} />
      <SideRow label="Avg per hit" sides={sides} render={perHit} />
      {hasBounty && <SideRow label="Bounty" sides={sides} render={s => orDash(s.moneyPool, compact)} />}
      {hasBounty && <SideRow label="Per 1K damage" sides={sides} render={s => orDash(s.moneyPer1k, perK)} />}
    </dl>
  )
}

function Orders({ orders }: { orders: BattleDetail['orders'] }) {
  return (
    <ul className="space-y-1.5 text-sm">
      {orders.map(o => (
        <li key={`${o.side}-${o.id}`} className="flex items-center gap-2">
          <SideDot side={o.side} />
          <div className="min-w-0 flex-1">
            {o.kind === 'mu'
              ? <GroupCell kind="mu" name={o.name} id={o.id} avatarUrl={o.avatarUrl} />
              : <CountryCell countryCode={o.countryCode} countryName={o.name} countryId={o.id} />}
          </div>
          <Badge variant="ghost" className="text-muted-foreground">{o.priority}</Badge>
        </li>
      ))}
    </ul>
  )
}

function Contracts({ contracts }: { contracts: BattleDetail['contracts'] }) {
  return (
    <ul className="space-y-1.5 text-sm">
      {contracts.map(c => (
        <li key={c.id} className="flex items-center gap-2">
          <SideDot side={c.side} />
          <div className="min-w-0 flex-1">
            <GroupCell kind="mu" name={c.muName} id={c.muId} avatarUrl={c.muAvatarUrl} />
          </div>
          {c.status === 'active' && <Badge variant="ghost" className="text-fire">bidding</Badge>}
          <span className="text-muted-foreground text-xs tabular-nums">
            <CompactNumber value={c.budget} />
            {` · ${formatDecimal(c.perK, 2)} / 1K`}
          </span>
        </li>
      ))}
    </ul>
  )
}

/**
 * The battle page's left column: the matchup, when and where, then each
 * side's numbers, orders and hired mercenaries.
 */
export function BattleSidebar({ battle: b, detail }: { battle: BattleRow, detail: BattleDetail | null }) {
  const startedAt = detail?.startedAt ?? b.createdAt
  const liveRound = detail?.rounds.find(r => r.isActive)?.number

  return (
    <DetailSidebar wash="var(--muted)" avatar={<BattleMatchup battle={b} />}>
      <dl className="space-y-1 text-sm">
        <Fact label="Status">
          {b.isActive
            ? (
                <Badge variant="ghost" className="text-fire">
                  {liveRound ? `Active · round ${liveRound}` : 'Active'}
                </Badge>
              )
            : <span>Ended <RelativeTime iso={b.endedAt} /></span>}
        </Fact>
        <Fact label="Region">
          {b.regionName ? <RegionLink id={b.regionId} name={b.regionName} className="truncate" /> : <EmptyDash />}
        </Fact>
        <Fact label="Started"><RelativeTime iso={startedAt} /></Fact>
        <Fact label={b.isActive ? 'Running for' : 'Lasted'}>
          {startedAt ? formatDuration(elapsedMs(startedAt, b.endedAt)) : <EmptyDash />}
        </Fact>
      </dl>
      <ExternalLink href={wareraUrl('battle', b.id)}>WarEra.io</ExternalLink>

      {detail && (
        <SidebarSection>
          <SectionHeading title="Sides" />
          <SideStats battle={b} sides={detail.sides} />
        </SidebarSection>
      )}
      {!!detail?.orders.length && (
        <SidebarSection>
          <SectionHeading title="Battle orders" />
          <Orders orders={detail.orders} />
        </SidebarSection>
      )}
      {!!detail?.contracts.length && (
        <SidebarSection>
          <SectionHeading title="Mercenary contracts" />
          <Contracts contracts={detail.contracts} />
        </SidebarSection>
      )}
    </DetailSidebar>
  )
}
