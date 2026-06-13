'use client'

import type { ColumnDef } from '@tanstack/react-table'

import type { AllianceRow } from '@/lib/rows'

import { AllianceAvatar } from '@/components/cells/alliance-avatar'
import { UserNameCell } from '@/components/cells/user-name-cell'
import { WareraLinkIcon } from '@/components/cells/warera-link-icon'
import { buildColumns } from '@/components/data-table/column-categories'
import { compactNumberColumn, dateColumn, localeNumberColumn, tierColumn } from '@/components/data-table/column-factories'
import { casesColumns, pointsColumns, wealthColumns } from '@/components/data-table/column-groups'
import { Flag } from '@/components/flag'
import { InternalLink } from '@/components/links'
import { UserHoverCard } from '@/components/user-hover-card'
import { schemeRgb } from '@/lib/warera/color-schemes'

export type { AllianceRow }

/**
 * The identity cell: the alliance logo (or monogram) beside the linked name,
 * washed in the alliance's color scheme. The tint and 3px scheme edge are an
 * absolute full-bleed layer (the cell itself is `relative` via
 * meta.cellClassName), so they track the row height when another cell wraps
 * taller; the tint's alpha layers over the sticky column's opaque background.
 * The member flags live in their own Members column, so this stays one line
 * and fits the narrow sticky column on mobile.
 */
function identityCell(a: AllianceRow) {
  const rgb = schemeRgb(a.scheme)

  return (
    <>
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(90deg, rgba(${rgb}, 0.18), transparent 80%)`,
          borderLeft: `3px solid rgb(${rgb})`,
        }}
      />
      {/* min-h matches a two-line flag wrap in the Members column, so every
          row sits at the same height whether or not its flags wrap. */}
      <div className="relative flex min-h-11 items-center gap-2.5 overflow-hidden">
        <AllianceAvatar name={a.name} avatarUrl={a.avatarUrl} scheme={a.scheme} size={32} />
        <span className="flex min-w-0 flex-1 items-center gap-2">
          <InternalLink href={`/alliances/${a.id}`} className="font-brand truncate text-base tracking-wide">
            {a.name}
          </InternalLink>
          <WareraLinkIcon kind="alliance" id={a.id} />
        </span>
      </div>
    </>
  )
}

/**
 * Every member's flag (ordered by development contribution, country name on
 * hover), sortable by member count.
 */
const membersColumn: ColumnDef<AllianceRow> = {
  accessorKey: 'memberCount',
  header: 'Members',
  cell: ({ row }) => (
    <span className="flex flex-wrap items-center gap-1">
      {row.original.members.map(m => (
        <span key={m.countryId} title={m.name}>
          <Flag code={m.code} />
        </span>
      ))}
    </span>
  ),
  sortDescFirst: true,
  meta: { width: 230 },
}

export const allianceColumns: ColumnDef<AllianceRow>[] = buildColumns<AllianceRow>(
  {
    accessorKey: 'name',
    header: 'Alliance',
    cell: ({ row }) => identityCell(row.original),
    meta: { width: 280, cellClassName: 'relative' },
  },
  {
    points: pointsColumns<AllianceRow>('citizens'),
    general: [
      membersColumn,
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
        meta: { heat: 'median', align: 'right', width: 150, tooltip: 'Combined development of the regions the members currently hold; drives the tier.' },
      },
      {
        accessorKey: 'coreDevelopment',
        header: 'Core Dev',
        cell: ({ row }) =>
          row.original.coreDevelopment !== null ? row.original.coreDevelopment.toFixed(1) : null,
        sortDescFirst: true,
        meta: { heat: 'median', align: 'right', width: 115, tooltip: 'Combined development of the members’ core (original) regions.' },
      },
      {
        accessorKey: 'averageDevelopment',
        header: 'Avg Dev',
        cell: ({ row }) =>
          row.original.averageDevelopment !== null ? row.original.averageDevelopment.toFixed(1) : null,
        sortDescFirst: true,
        meta: { heat: 'median', align: 'right', width: 110, tooltip: '(core + current development) / 2' },
      },
      tierColumn<AllianceRow>('developmentTier'),
    ],
    combat: [
      compactNumberColumn<AllianceRow>('totalDamage', 'Total Damage', { heat: 'median', width: 140 }),
      compactNumberColumn<AllianceRow>('weeklyDamage', 'Weekly', { heat: 'median', width: 110 }),
      compactNumberColumn<AllianceRow>('weeklyDamagePerCitizen', 'Weekly / Citizen', { heat: 'median', width: 170 }),
    ],
    wealth: wealthColumns<AllianceRow>('citizenWealth', 'citizens'),
    cases: casesColumns<AllianceRow>(),
  },
)
