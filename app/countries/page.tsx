import type { Metadata } from 'next'

import { connection } from 'next/server'

import { NoDataPage } from '@/components/layout/no-data-page'

import { PageShell } from '@/components/layout/page-shell'
import { withActiveBattleCounts } from '@/lib/cache/live-battles'
import { getSnapshot } from '@/lib/cache/memory'
import { formatNumber } from '@/lib/format'
import { pageMetadata } from '@/lib/metadata'

import { firstPage } from '@/lib/query'
import { CountriesTable } from './countries-table'

export const metadata: Metadata = pageMetadata({
  title: 'Countries',
  description: 'Every WarEra.io country ranked by points, with population, military strength, economy, taxes and government.',
  path: '/countries',
})

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
      subtitle={`All ${formatNumber(initial.total)} countries in Warera.`}
    >
      <CountriesTable initial={initial} />
    </PageShell>
  )
}
