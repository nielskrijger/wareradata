import type { Metadata } from 'next'

import { connection } from 'next/server'

import { NoDataPage } from '@/components/no-data-page'
import { PageShell } from '@/components/page-shell'
import { getSnapshot } from '@/lib/cache/memory'
import { applyQuery, DEFAULT_PAGE_SIZE } from '@/lib/query'

import { UsersTable } from './users-table'

export const metadata: Metadata = {
  title: 'Users',
  description: 'All ranked WarEra.io players.',
}

export default async function UsersPage() {
  // Marks the page as request-time dynamic under cacheComponents. Without
  // this, Next prerenders at build time against an empty snapshot and serves
  // that static HTML forever — the in-memory snapshot is never read.
  await connection()
  const { users } = await getSnapshot()

  if (!users.length) {
    return <NoDataPage />
  }

  // Server-render just the first page; the client takes over for any
  // subsequent paging/sorting/filtering via /api/users.
  const initial = applyQuery(
    users,
    { page: 0, pageSize: DEFAULT_PAGE_SIZE, sort: 'points', dir: 'desc', filter: '' },
    () => '',
    row => row.points,
  )

  return (
    <PageShell
      title="Users"
      subtitle={`All ${initial.total.toLocaleString()} ranked players in Warera.`}
    >
      <UsersTable initial={initial} />
    </PageShell>
  )
}
