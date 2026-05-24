'use client'

import type { PageRequest, PageResult } from '@/components/data-table/data-table'
import type { PartyRow } from '@/lib/rows'

import { AdvancedSearchHint } from '@/components/data-table/advanced-search-hint'
import { DataTable } from '@/components/data-table/data-table'

import { partyColumns } from './columns'

async function fetchParties(req: PageRequest): Promise<PageResult<PartyRow>> {
  const params = new URLSearchParams({
    page: String(req.page),
    pageSize: String(req.pageSize),
    dir: req.dir,
  })
  if (req.sort) {
    params.set('sort', req.sort)
  }
  if (req.filter) {
    params.set('filter', req.filter)
  }
  const res = await fetch(`/api/parties?${params.toString()}`)
  if (!res.ok) {
    throw new Error(`Parties fetch failed: ${res.status}`)
  }
  return res.json() as Promise<PageResult<PartyRow>>
}

interface Props {
  initial: PageResult<PartyRow>
}

export function PartiesTable({ initial }: Props) {
  return (
    <DataTable
      columns={partyColumns}
      initialData={initial}
      initialSort={{ id: 'totalPoints', desc: true }}
      fetchPage={fetchParties}
      searchPlaceholder="Filter by party, country, or leader…"
      searchHint={(
        <AdvancedSearchHint
          introText="Type plain text to search across name, country, and leader. Or use field-specific syntax:"
          examples={[
            { q: 'liberal', desc: 'Search any field' },
            { q: 'country:nl', desc: 'Field match' },
            { q: 'members:>10', desc: 'Comparators' },
            { q: 'militarism:[50 TO 100]', desc: 'Numeric range' },
            { q: 'country:nl AND members:>5', desc: 'Combine with AND/OR' },
          ]}
          fieldsList="name, country, leader, members, points, avg, militarism, isolationism, imperialism, industrialism."
        />
      )}
    />
  )
}
