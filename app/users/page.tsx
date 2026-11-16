import type { Metadata } from 'next'

import { connection } from 'next/server'

import { NoDataPage } from '@/components/layout/no-data-page'

import { PageShell } from '@/components/layout/page-shell'
import { getSnapshot } from '@/lib/cache/memory'
import { formatNumber } from '@/lib/format'
import { pageMetadata } from '@/lib/metadata'

import { firstPage } from '@/lib/query'
import { UsersTable } from './users-table'

export const metadata: Metadata = pageMetadata({
  title: 'Users',
  description: 'Leaderboard of all ranked WarEra.io players: points, level, damage, wealth, gear, factories and more.',
  path: '/users',
})

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
  const initial = firstPage(users, 'points')

  return (
    <PageShell
      title="Users"
      subtitle={`All ${formatNumber(initial.total)} ranked players in Warera.`}
    >
      <UsersTable initial={initial} />
    </PageShell>
  )
}
