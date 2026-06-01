import type { Metadata } from 'next'

import { connection } from 'next/server'

import { NoDataPage } from '@/components/layout/no-data-page'
import { PageShell } from '@/components/layout/page-shell'
import { getSnapshot } from '@/lib/cache/memory'
import { applyQuery, DEFAULT_PAGE_SIZE } from '@/lib/query'

import { MUsTable } from './mus-table'

export const metadata: Metadata = {
  title: 'Military Units',
  description: 'All Military Units in WarEra.io.',
}

export default async function MUsPage() {
  await connection()
  const { mus } = await getSnapshot()

  if (!mus.length) {
    return <NoDataPage />
  }

  const initial = applyQuery(
    mus,
    { page: 0, pageSize: DEFAULT_PAGE_SIZE, sort: 'totalPoints', dir: 'desc', filter: '' },
    () => '',
    row => row.totalPoints,
  )

  return (
    <PageShell
      title="Military Units"
      subtitle={`All ${initial.total.toLocaleString()} Military Units in WarEra.io.`}
    >
      <MUsTable initial={initial} />
    </PageShell>
  )
}
