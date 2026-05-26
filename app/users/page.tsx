import type { Metadata } from 'next'

import { NoDataPage } from '@/components/no-data-page'
import { PageShell } from '@/components/page-shell'
import { getSnapshot } from '@/lib/cache/memory'
import { applyQuery, DEFAULT_PAGE_SIZE } from '@/lib/query'

import { UsersTable } from './users-table'

// Reads are served from the warm in-memory snapshot (sub-ms), so there is no
// caching win from ISR; force-dynamic avoids serving a cached "no data" page
// from the window between boot and the scraper's first cycle.
export const dynamic = 'force-dynamic'

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
