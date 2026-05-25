'use client'

import type { PageRequest, PageResult } from '@/components/data-table/data-table'
import type { MURow } from '@/lib/rows'

import { useCallback } from 'react'

import { AdvancedSearchHint } from '@/components/data-table/advanced-search-hint'
import { combineFilter } from '@/components/data-table/combine-filter'
import { DataTable } from '@/components/data-table/data-table'

import { muColumns } from './columns'

async function fetchMUs(req: PageRequest, baseFilter?: string): Promise<PageResult<MURow>> {
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
  const res = await fetch(`/api/mus?${params.toString()}`)
  if (!res.ok) {
    throw new Error(`MUs fetch failed: ${res.status}`)
  }
  return res.json() as Promise<PageResult<MURow>>
}

interface Props {
  initial: PageResult<MURow>
  /**
   * Scopes the table via a structured filter that's always applied (e.g.
   * `countryCode:<code>` on the country page). Combined with the user's search.
   */
  baseFilter?: string
}

export function MUsTable({ initial, baseFilter }: Props) {
  const fetchPage = useCallback(
    (req: PageRequest) => fetchMUs(req, baseFilter),
    [baseFilter],
  )

  return (
    <DataTable
      columns={muColumns}
      initialData={initial}
      initialSort={{ id: 'totalPoints', desc: true }}
      fetchPage={fetchPage}
      searchPlaceholder="Filter by MU name or country…"
      searchHint={(
        <AdvancedSearchHint
          introText="Type plain text to search across name, country, and region. Or use field-specific syntax:"
          examples={[
            { q: 'oranje', desc: 'Search any field' },
            { q: 'country:nl', desc: 'Field match' },
            { q: '-region:limburg', desc: 'Exclude with -' },
            { q: 'members:[10 TO 50]', desc: 'Numeric range' },
            { q: 'damage:>1000000', desc: 'Comparators' },
            { q: 'country:nl AND members:>20', desc: 'Combine with AND/OR' },
          ]}
          fieldsList="name, country, members, damage, weeklyDamage, wealth, and more."
        />
      )}
    />
  )
}
