'use client'

import type { PageRequest, PageResult } from '@/components/data-table/data-table'
import type { MURow } from '@/lib/rows'

import { DataTable } from '@/components/data-table/data-table'

import { muColumns } from './columns'

async function fetchMUs(req: PageRequest): Promise<PageResult<MURow>> {
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
  const res = await fetch(`/api/mus?${params.toString()}`)
  if (!res.ok) {
    throw new Error(`MUs fetch failed: ${res.status}`)
  }
  return res.json() as Promise<PageResult<MURow>>
}

interface Props {
  initial: PageResult<MURow>
}

export function MUsTable({ initial }: Props) {
  return (
    <DataTable
      columns={muColumns}
      initialData={initial}
      initialSort={{ id: 'totalPoints', desc: true }}
      fetchPage={fetchMUs}
      searchPlaceholder="Filter by MU name…"
    />
  )
}
