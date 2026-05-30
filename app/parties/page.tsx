import type { Metadata } from 'next'

import { connection } from 'next/server'

import { NoDataPage } from '@/components/layout/no-data-page'
import { PageShell } from '@/components/layout/page-shell'
import { getSnapshot } from '@/lib/cache/memory'
import { applyQuery, DEFAULT_PAGE_SIZE } from '@/lib/query'

import { PartiesTable } from './parties-table'

export const metadata: Metadata = {
  title: 'Parties',
  description: 'All political parties in WarEra.io.',
}

export default async function PartiesPage() {
  await connection()
  const { parties } = await getSnapshot()

  if (!parties.length) {
    return <NoDataPage />
  }

  const initial = applyQuery(
    parties,
    { page: 0, pageSize: DEFAULT_PAGE_SIZE, sort: 'totalPoints', dir: 'desc', filter: '' },
    () => '',
    row => row.totalPoints,
  )

  return (
    <PageShell
      title="Parties"
      subtitle={`All ${initial.total.toLocaleString()} political parties in WarEra.io.`}
    >
      <PartiesTable initial={initial} />
    </PageShell>
  )
}
