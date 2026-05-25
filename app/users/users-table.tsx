'use client'

import type { PageRequest, PageResult } from '@/components/data-table/data-table'
import type { UserRow } from '@/lib/rows'

import { useCallback } from 'react'

import { AdvancedSearchHint } from '@/components/data-table/advanced-search-hint'
import { combineFilter } from '@/components/data-table/combine-filter'
import { DataTable } from '@/components/data-table/data-table'

import { userColumns } from './columns'

async function fetchUsers(req: PageRequest, baseFilter?: string): Promise<PageResult<UserRow>> {
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
  const res = await fetch(`/api/users?${params.toString()}`)
  if (!res.ok) {
    throw new Error(`Users fetch failed: ${res.status}`)
  }
  return res.json() as Promise<PageResult<UserRow>>
}

interface Props {
  initial: PageResult<UserRow>
  /**
   * Scopes the table to a subset of users via a structured filter that's
   * always applied (e.g. `muId:<id>`). Combined with the user's search.
   */
  baseFilter?: string
}

export function UsersTable({ initial, baseFilter }: Props) {
  const fetchPage = useCallback(
    (req: PageRequest) => fetchUsers(req, baseFilter),
    [baseFilter],
  )

  return (
    <DataTable
      columns={userColumns}
      initialData={initial}
      initialSort={{ id: 'points', desc: true }}
      fetchPage={fetchPage}
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
          fieldsList="username, country, mu, party, level, damage, health, hunger, status, and more."
        />
      )}
    />
  )
}
