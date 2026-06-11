'use client'

import type { ColumnDef } from '@tanstack/react-table'

import type { AllianceRow } from '@/lib/rows'

import { AllianceAvatar } from '@/components/cells/alliance-avatar'
import { UserNameCell } from '@/components/cells/user-name-cell'
import { WareraLinkIcon } from '@/components/cells/warera-link-icon'
import { buildColumns } from '@/components/data-table/column-categories'
import { compactNumberColumn, dateColumn, localeNumberColumn, pointsColumns, tierColumn, wealthBreakdownColumns } from '@/components/data-table/column-factories'
import { Flag } from '@/components/flag'
import { InternalLink } from '@/components/links'
import { UserHoverCard } from '@/components/user-hover-card'
import { schemeRgb } from '@/lib/warera/color-schemes'

export type { AllianceRow }

/**
 * The two-line identity cell: the alliance logo (or monogram) beside the
 * linked name and the full member-flag roster (ordered by development
 * contribution), washed in the alliance's color scheme. The wrapper's negative
 * margin cancels the TableCell padding so the tint and the 3px scheme edge
 * reach the cell borders; the tint's alpha layers over the sticky column's
 * opaque background.
 */
function identityCell(a: AllianceRow) {
  const rgb = schemeRgb(a.scheme)

  return (
    <div
      className="-m-2 flex items-center gap-2.5 overflow-hidden p-2"
      style={{
        background: `linear-gradient(90deg, rgba(${rgb}, 0.18), transparent 80%)`,
        borderLeft: `3px solid rgb(${rgb})`,
      }}
    >
      <AllianceAvatar name={a.name} avatarUrl={a.avatarUrl} scheme={a.scheme} size={32} />
      <div className="min-w-0 flex-1 space-y-1.5">
        <span className="flex items-center gap-2">
          <InternalLink href={`/alliances/${a.id}`} className="font-brand truncate text-base tracking-wide">
            {a.name}
          </InternalLink>
          <WareraLinkIcon kind="alliance" id={a.id} />
        </span>
        <span className="flex flex-wrap items-center gap-1">
          {a.members.map(m => (
            <span key={m.countryId} title={m.name}>
              <Flag code={m.code} />
            </span>
          ))}
        </span>
      </div>
    </div>
  )
}

export const allianceColumns: ColumnDef<AllianceRow>[] = buildColumns<AllianceRow>(
  {
    accessorKey: 'name',
    header: 'Alliance',
    cell: ({ row }) => identityCell(row.original),
    meta: { width: 280 },
  },
  {
    points: pointsColumns<AllianceRow>('citizens'),
    general: [
      localeNumberColumn<AllianceRow>('population', 'Population', { heat: 'ramp', width: 125 }),
      {
        accessorKey: 'leaderName',
        header: 'Leader',
        cell: ({ row }) => (
          <UserHoverCard userId={row.original.leaderId}>
            <UserNameCell
              userId={row.original.leaderId}
              name={row.original.leaderName}
              avatarUrl={row.original.leaderAvatarUrl}
              colorScheme={row.original.leaderColorScheme}
            />
          </UserHoverCard>
        ),
        meta: { width: 220 },
      },
      dateColumn<AllianceRow>('createdAt', 'Founded'),
      {
        accessorKey: 'development',
        header: 'Development',
        cell: ({ row }) =>
          row.original.development !== null ? row.original.development.toFixed(1) : null,
        sortDescFirst: true,
        meta: { heat: 'median', align: 'right', width: 150 },
      },
      tierColumn<AllianceRow>('developmentTier'),
    ],
    combat: [
      compactNumberColumn<AllianceRow>('totalDamage', 'Total Damage', { heat: 'median', width: 140 }),
      compactNumberColumn<AllianceRow>('weeklyDamage', 'Weekly', { heat: 'median', width: 110 }),
      compactNumberColumn<AllianceRow>('weeklyDamagePerCitizen', 'Weekly / Citizen', { heat: 'median', width: 170 }),
    ],
    wealth: wealthBreakdownColumns<AllianceRow>('citizenWealth', 'citizens'),
  },
)
