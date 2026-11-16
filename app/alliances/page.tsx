import type { Metadata } from 'next'

import { connection } from 'next/server'

import { NoDataPage } from '@/components/layout/no-data-page'

import { PageShell } from '@/components/layout/page-shell'
import { getSnapshot } from '@/lib/cache/memory'
import { pageMetadata } from '@/lib/metadata'
import { firstPage } from '@/lib/query'

import { AlliancesTable } from './alliances-table'

export const metadata: Metadata = pageMetadata({
  title: 'Alliances',
  description: 'Every WarEra.io alliance ranked by points, with member countries, military strength and wealth.',
  path: '/alliances',
})

export default async function AlliancesPage() {
  await connection()
  const { alliances } = await getSnapshot()

  if (!alliances.length) {
    return <NoDataPage />
  }

  const initial = firstPage(alliances, 'totalPoints')

  return (
    <PageShell
      title="Alliances"
      subtitle={`All ${initial.total.toLocaleString()} alliances in Warera.`}
    >
      <AlliancesTable initial={initial} />
    </PageShell>
  )
}
