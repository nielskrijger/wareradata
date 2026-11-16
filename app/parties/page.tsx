import type { Metadata } from 'next'

import { connection } from 'next/server'

import { NoDataPage } from '@/components/layout/no-data-page'

import { PageShell } from '@/components/layout/page-shell'
import { getSnapshot } from '@/lib/cache/memory'
import { formatNumber } from '@/lib/format'
import { pageMetadata } from '@/lib/metadata'

import { firstPage } from '@/lib/query'
import { PartiesTable } from './parties-table'

export const metadata: Metadata = pageMetadata({
  title: 'Parties',
  description: 'Every WarEra.io political party with members, points and country.',
  path: '/parties',
})

export default async function PartiesPage() {
  await connection()
  const { parties } = await getSnapshot()

  if (!parties.length) {
    return <NoDataPage />
  }

  const initial = firstPage(parties, 'totalPoints')

  return (
    <PageShell
      title="Parties"
      subtitle={`All ${formatNumber(initial.total)} political parties in WarEra.io.`}
    >
      <PartiesTable initial={initial} />
    </PageShell>
  )
}
