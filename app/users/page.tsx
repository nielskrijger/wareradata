import type { Metadata } from 'next'

import { NoDataPage } from '@/components/no-data-page'
import { PageShell } from '@/components/page-shell'
import { getSnapshot } from '@/lib/cache/memory'
import { applyQuery, DEFAULT_PAGE_SIZE } from '@/lib/query'

import { UsersTable } from './users-table'

export const revalidate = 600

export const metadata: Metadata = {
  title: 'Users',
  description: 'All ranked WarEra.io players.',
}

export default async function UsersPage() {
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
