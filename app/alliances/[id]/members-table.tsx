import type { AllianceRow } from '@/lib/rows'

import { TierBadge } from '@/components/badges/tier-badge'
import { CompactNumber } from '@/components/cells/compact-number'
import { HeatCell } from '@/components/data-table/heat-cell'
import { Flag } from '@/components/flag'
import { InfoTooltip } from '@/components/info-tooltip'
import { InternalLink } from '@/components/links'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { computeRanges } from '@/lib/query'

interface Props {
  alliance: AllianceRow
}

/**
 * The alliance's member roster as a mini countries table: each country's
 * development contribution (with its share of the alliance total) plus the
 * country stats the in-game view doesn't show, heat-tinted within the
 * alliance. Members come pre-sorted by core development from the row builder.
 * Static (10 rows at most), so a plain table rather than the DataTable
 * machinery.
 */
export function MembersTable({ alliance: a }: Props) {
  // Heat ranges within this alliance's members, so the tints compare the bloc's
  // countries against each other rather than the whole world.
  const ranges = computeRanges(a.members)

  // The members' core developments sum to the alliance's; fall back to the
  // recomputed sum if the alliance-level field is ever missing.
  const coreTotal = a.coreDevelopment ?? a.members.reduce((sum, m) => sum + m.coreDevelopment, 0)

  return (
    <div className="border-input bg-card overflow-x-auto rounded-md border dark:bg-input/50">
      <Table className="min-w-[860px]">
        <TableHeader>
          <TableRow>
            <TableHead>Country</TableHead>
            <TableHead className="text-right">
              <InfoTooltip
                label="Core Dev"
                hint="Development this country contributes to the alliance core; the members' core dev sums to the alliance total and drives the Share column."
              />
            </TableHead>
            <TableHead className="text-right">Share</TableHead>
            <TableHead className="text-right">
              <InfoTooltip
                label="Avg Dev"
                hint="The country's average development; the members' values sum to the alliance's average development."
              />
            </TableHead>
            <TableHead className="text-right">Population</TableHead>
            <TableHead className="text-right">Weekly Dmg</TableHead>
            <TableHead className="text-right">Wealth</TableHead>
            <TableHead className="text-right">Avg Lvl</TableHead>
            <TableHead>Tier</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {a.members.map((m) => {
            const share = coreTotal > 0 ? m.coreDevelopment / coreTotal : null
            return (
              <TableRow key={m.countryId}>
                <TableCell>
                  <span className="flex min-w-0 items-center gap-2">
                    <Flag code={m.code} />
                    <InternalLink href={`/countries/${m.countryId}`} className="truncate">{m.name}</InternalLink>
                    {m.suspended && <Badge variant="destructive">suspended</Badge>}
                  </span>
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  <HeatCell value={m.coreDevelopment} range={ranges.coreDevelopment} mode="median">
                    {m.coreDevelopment.toFixed(1)}
                  </HeatCell>
                </TableCell>
                <TableCell className="text-muted-foreground text-right text-xs tabular-nums">
                  {share !== null ? `${Math.round(share * 100)}%` : '—'}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  <HeatCell value={m.averageDevelopment} range={ranges.averageDevelopment} mode="median">
                    {m.averageDevelopment.toFixed(1)}
                  </HeatCell>
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {m.activePopulation === null
                    ? <span className="text-muted-foreground/50">—</span>
                    : (
                        <HeatCell value={m.activePopulation} range={ranges.activePopulation} mode="ramp">
                          {m.activePopulation.toLocaleString()}
                        </HeatCell>
                      )}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  <HeatCell value={m.weeklyDamage} range={ranges.weeklyDamage} mode="median">
                    <CompactNumber value={m.weeklyDamage} />
                  </HeatCell>
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  <HeatCell value={m.citizenWealth} range={ranges.citizenWealth} mode="median">
                    <CompactNumber value={m.citizenWealth} />
                  </HeatCell>
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {m.avgLevel === null
                    ? <span className="text-muted-foreground/50">—</span>
                    : (
                        <HeatCell value={m.avgLevel} range={ranges.avgLevel} mode="median">
                          {m.avgLevel}
                        </HeatCell>
                      )}
                </TableCell>
                <TableCell><TierBadge tier={m.damageTier} /></TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
