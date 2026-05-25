'use client'

import type { PageRequest, PageResult } from '@/components/data-table/data-table'
import type { PartyRow } from '@/lib/rows'

import { useCallback } from 'react'

import { AdvancedSearchHint } from '@/components/data-table/advanced-search-hint'
import { combineFilter } from '@/components/data-table/combine-filter'
import { DataTable } from '@/components/data-table/data-table'

import { partyColumns } from './columns'

async function fetchParties(req: PageRequest, baseFilter?: string): Promise<PageResult<PartyRow>> {
  const params = new URLSearchParams({
    page: String(req.page),
    pageSize: String(req.pageSize),
    dir: req.dir,
  })
  if (req.sort) {
    params.set('sort', req.sort)
  }
  const filter = combineFilter(baseFilter, req.filter)
  if (filter) {
    params.set('filter', filter)
  }
  const res = await fetch(`/api/parties?${params.toString()}`)
  if (!res.ok) {
    throw new Error(`Parties fetch failed: ${res.status}`)
  }
  return res.json() as Promise<PageResult<PartyRow>>
}

interface Props {
  initial: PageResult<PartyRow>
  /**
   * Scopes the table via a structured filter that's always applied (e.g.
   * `countryCode:<code>` on the country page). Combined with the user's search.
   */
  baseFilter?: string
}

export function PartiesTable({ initial, baseFilter }: Props) {
  const fetchPage = useCallback(
    (req: PageRequest) => fetchParties(req, baseFilter),
    [baseFilter],
  )

  return (
    <DataTable
      columns={partyColumns}
      initialData={initial}
      initialSort={{ id: 'totalPoints', desc: true }}
      fetchPage={fetchPage}
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
