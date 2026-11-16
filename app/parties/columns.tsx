'use client'

import type { ColumnDef } from '@/components/data-table/features'

import type { PartyRow } from '@/lib/rows'

import { GroupCell } from '@/components/cells/group-cell'
import { IdentityCell } from '@/components/cells/identity-cell'
import { buildColumns } from '@/components/data-table/column-categories'
import {
  avgLevelColumn,
  countryColumn,
  dateColumn,
  leaderColumn,
  localeNumberColumn,
} from '@/components/data-table/column-factories'
import { casesColumns, pointsColumns, premiumColumns, wealthColumns } from '@/components/data-table/column-groups'

export type { PartyRow }

export const partyColumns: ColumnDef<PartyRow>[] = buildColumns<PartyRow>(
  {
    accessorKey: 'name',
    header: 'Party',
    cell: ({ row }) => (
      <IdentityCell kind="party" id={row.original.id}>
        <GroupCell
          kind="party"
          name={row.original.name}
          id={row.original.id}
          avatarUrl={row.original.avatarUrl}
          countryCode={row.original.countryCode}
          bold
        />
      </IdentityCell>
    ),
    meta: { width: 240 },
  },
  {
    points: pointsColumns<PartyRow>('members'),
    general: [
      avgLevelColumn<PartyRow>(),
      // The flag on the avatar already shows the country.
      countryColumn<PartyRow>({ hiddenByDefault: true }),
      localeNumberColumn<PartyRow>('memberCount', 'Members', { heat: 'ramp', width: 100 }),
      leaderColumn<PartyRow>(),
      dateColumn<PartyRow>('createdAt', 'Founded'),
    ],
    wealth: wealthColumns<PartyRow>('memberWealth', 'members'),
    premium: premiumColumns<PartyRow>(),
    cases: casesColumns<PartyRow>(),
  },
)
