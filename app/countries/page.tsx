import type { Metadata } from 'next'

import { connection } from 'next/server'

import { NoDataPage } from '@/components/layout/no-data-page'
import { PageShell } from '@/components/layout/page-shell'
import { withActiveBattleCounts } from '@/lib/cache/live-battles'
import { getSnapshot } from '@/lib/cache/memory'
import { firstPage } from '@/lib/query'

import { CountriesTable } from './countries-table'

export const metadata: Metadata = {
  title: 'Countries',
  description: 'All WarEra.io countries.',
}

export default async function CountriesPage() {
  await connection()
  const { countries } = await getSnapshot()

  if (!countries.length) {
    return <NoDataPage />
  }

  const initial = firstPage(await withActiveBattleCounts(countries), 'totalPoints')

  return (
    <PageShell
      title="Countries"
      subtitle={`All ${initial.total.toLocaleString()} countries in Warera.`}
    >
      <CountriesTable initial={initial} />
    </PageShell>
  )
}
