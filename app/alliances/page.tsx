import type { Metadata } from 'next'

import { connection } from 'next/server'

import { NoDataPage } from '@/components/layout/no-data-page'
import { PageShell } from '@/components/layout/page-shell'
import { getSnapshot } from '@/lib/cache/memory'
import { applyQuery, DEFAULT_PAGE_SIZE } from '@/lib/query'

import { AlliancesTable } from './alliances-table'

export const metadata: Metadata = {
  title: 'Alliances',
  description: 'All WarEra.io alliances.',
}

export default async function AlliancesPage() {
  await connection()
  const { alliances } = await getSnapshot()

  if (!alliances.length) {
    return <NoDataPage />
  }

  const initial = applyQuery(
    alliances,
    { page: 0, pageSize: DEFAULT_PAGE_SIZE, sort: 'totalPoints', dir: 'desc', filter: '' },
    () => '',
    row => row.totalPoints,
  )

  return (
    <PageShell
      title="Alliances"
      subtitle={`All ${initial.total.toLocaleString()} alliances in Warera.`}
    >
      <AlliancesTable initial={initial} />
    </PageShell>
  )
}
