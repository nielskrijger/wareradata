'use client'

import type { EntityTableProps } from '@/components/data-table/data-table'
import type { UserRow } from '@/lib/rows'

import { AdvancedSearchHint } from '@/components/data-table/advanced-search-hint'
import { DataTable } from '@/components/data-table/data-table'
import { useSetHoveredMember } from '@/components/detail/hovered-member-context'

import { userColumns } from './columns'

export function UsersTable({ initial, baseFilter, omitColumns }: EntityTableProps<UserRow>) {
  // Places the hovered player on the page's rank map, if there is one.
  const setHovered = useSetHoveredMember()

  return (
    <DataTable
      tableId="users"
      columns={userColumns}
      initialData={initial}
      initialSort={{ id: 'points', desc: true }}
      endpoint="/api/users"
      baseFilter={baseFilter}
      omitColumns={omitColumns}
      onRowHover={setHovered}
      searchPlaceholder="Filter by username, country, MU, or party…"
      searchHint={(
        <AdvancedSearchHint
          introText="Type plain text to search across username, country, MU, and party. Or use field-specific syntax:"
          examples={[
            { q: 'alice', desc: 'Search any field' },
            { q: 'country:nl', desc: 'Field match' },
            { q: 'party:"Gulden Verbond"', desc: 'Quoted with spaces' },
            { q: '-mu:"Bla bla"', desc: 'Exclude with -' },
            { q: 'rank:[1 TO 100]', desc: 'Numeric range' },
            { q: 'level:>30', desc: 'Comparators' },
          ]}
          fieldsList="username, country, mu, party, level, damage, health, hunger, buff, companies, stockpile, items, cash, equipment, weapons, cases, luck, and more."
        />
      )}
    />
  )
}
