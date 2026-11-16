import type { Metadata } from 'next'

import { notFound } from 'next/navigation'
import { connection } from 'next/server'

import { AdviseList } from '@/components/advise/advise-list'
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
 * A player's to-do list, kept narrow so rows stay readable on wide screens.
 */
export default async function AdvisePage({ params }: PageProps) {
  await connection()
  const { id } = await params
  const [data, { gameConfig }, prices] = await Promise.all([getAdviceData(id), getSnapshot(), getItemPrices()])
  if (!data) {
    notFound()
  }

  return (
    <main className={cn('space-y-6 px-6 py-8 sm:px-8', ADVISE_WIDTH)}>
      <AdviseList result={buildAdvice(advisorInputFromData(data, gameConfig, prices))} />
    </main>
  )
}
