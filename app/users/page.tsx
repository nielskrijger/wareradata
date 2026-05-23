import type { Metadata } from 'next'

import { getSnapshot } from '@/lib/cache/memory'
import { applyQuery, DEFAULT_PAGE_SIZE } from '@/lib/query'

import { UsersTable } from './users-table'

export const revalidate = 600

export const metadata: Metadata = {
  title: 'Users — WareraData',
  description: 'All ranked Warera players.',
}

export default async function UsersPage() {
  const { users } = await getSnapshot()

  if (!users.length) {
    return (
      <main className="space-y-6 px-6 py-8 sm:px-8 lg:px-12">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
        </header>
        <p className="text-muted-foreground text-sm">
          No data yet — the scrape job hasn&apos;t populated the cache. Trigger the{' '}
          <code className="rounded bg-muted px-1 py-0.5">refresh-data</code> workflow.
        </p>
      </main>
    )
  }

  // Server-render just the first page; the client takes over for any
  // subsequent paging/sorting/filtering via /api/users.
  const initial = applyQuery(
    users,
    { page: 0, pageSize: DEFAULT_PAGE_SIZE, sort: 'levelRank', dir: 'asc', filter: '' },
    () => '',
    row => row.levelRank,
  )

  return (
    <main className="space-y-6 px-6 py-8 sm:px-8 lg:px-12">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
        <p className="text-muted-foreground text-sm">
          All {initial.total.toLocaleString()} ranked players in Warera.
        </p>
      </header>
      <UsersTable initial={initial} />
    </main>
  )
}
