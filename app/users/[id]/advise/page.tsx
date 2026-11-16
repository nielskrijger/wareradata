import type { Metadata } from 'next'

import { notFound } from 'next/navigation'
import { connection } from 'next/server'

import { AdviseList } from '@/components/advise/advise-list'
import { ItemCatalogProvider } from '@/components/item-icon'
import { PageMain } from '@/components/layout/page-main'
import { buildAdvice } from '@/lib/advisor/build'
import { advisorInputFromData } from '@/lib/advisor/input'
import { getSnapshot } from '@/lib/cache/memory'
import { cn } from '@/lib/utils'

import { getAdviceData, getItemPrices } from '@/lib/warera/api'
import { ADVISE_WIDTH } from './width'

export const metadata: Metadata = {
  title: 'Advise',
  robots: { index: false, follow: false },
}

interface PageProps {
  params: Promise<{ id: string }>
}

/**
 * A player's best next actions, kept narrower than the site so rows stay readable.
 */
export default async function AdvisePage({ params }: PageProps) {
  await connection()
  const { id } = await params
  const [data, { gameConfig }, prices] = await Promise.all([getAdviceData(id), getSnapshot(), getItemPrices()])
  if (!data) {
    notFound()
  }

  const input = advisorInputFromData(data, gameConfig, prices)

  return (
    <PageMain className={cn('space-y-6', ADVISE_WIDTH)}>
      <ItemCatalogProvider catalog={{ prices: input.prices, recipe: input.recipe }}>
        <AdviseList result={buildAdvice(input)} user={{ id, name: data.user.username }} />
      </ItemCatalogProvider>
    </PageMain>
  )
}
