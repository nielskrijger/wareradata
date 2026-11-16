import type { Metadata } from 'next'

import { connection } from 'next/server'

import { AdviseTodo } from '@/components/advise/advise-todo'
import { PageTitle } from '@/components/layout/page-title'
import { Paragraph } from '@/components/paragraph'
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

async function loadAdvice() {
  const [data, { gameConfig }, prices] = await Promise.all([getAdviceData(), getSnapshot(), getItemPrices()])

  return data ? buildAdvice(advisorInputFromData(data, gameConfig, prices)) : null
}

/**
 * The API key owner's to-do list, kept narrow so rows stay readable on wide screens.
 */
export default async function AdvisePage() {
  await connection()
  const result = await loadAdvice()

  return (
    <main className={cn('space-y-6 px-6 py-8 sm:px-8', ADVISE_WIDTH)}>
      {result
        ? <AdviseTodo result={result} />
        : (
            <>
              <PageTitle>Today&apos;s to-do</PageTitle>
              <Paragraph>The API key&apos;s owner has no employees yet.</Paragraph>
            </>
          )}
    </main>
  )
}
