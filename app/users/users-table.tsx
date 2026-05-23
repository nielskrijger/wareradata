'use client'

import type { PageRequest, PageResult } from '@/components/data-table/data-table'
import type { UserRow } from '@/lib/rows'

import { DataTable } from '@/components/data-table/data-table'

import { userColumns } from './columns'

async function fetchUsers(req: PageRequest): Promise<PageResult<UserRow>> {
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
  const res = await fetch(`/api/users?${params.toString()}`)
  if (!res.ok) {
    throw new Error(`Users fetch failed: ${res.status}`)
  }
  return res.json() as Promise<PageResult<UserRow>>
}

interface Props {
  initial: PageResult<UserRow>
}

export function UsersTable({ initial }: Props) {
  return (
    <DataTable
      columns={userColumns}
      initialData={initial}
      initialSort={{ id: 'levelRank', desc: false }}
      fetchPage={fetchUsers}
      searchPlaceholder="Filter by username, country, or MU…"
    />
  )
}
