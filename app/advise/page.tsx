import type { Metadata } from 'next'

import { notFound } from 'next/navigation'
import { connection } from 'next/server'

import { AdviseTodo } from '@/components/advise/advise-todo'
import { PageTitle } from '@/components/layout/page-title'
import { Paragraph } from '@/components/paragraph'
import { buildAdvice } from '@/lib/advisor/build'
import { advisorInputFromData } from '@/lib/advisor/input'
import { getSnapshot } from '@/lib/cache/memory'
import { getAdviceData, getItemPrices } from '@/lib/warera/api'

export const metadata: Metadata = {
  title: 'Advise',
  robots: { index: false, follow: false },
}

async function loadAdvice() {
  const [data, { gameConfig }, prices] = await Promise.all([getAdviceData(), getSnapshot(), getItemPrices()])

  return data ? buildAdvice(advisorInputFromData(data, gameConfig, prices, new Date())) : null
}

/**
 * The API key owner's private to-do list. It shows that one account's
 * employees, so it stays off unless `ADVISE_ENABLED=1`.
 */
export default async function AdvisePage() {
  if (process.env.ADVISE_ENABLED !== '1') {
    notFound()
  }

  await connection()
  const result = await loadAdvice()

  return (
    <main className="space-y-6 px-6 py-8 sm:px-8 lg:px-12">
      <header className="space-y-2">
        <PageTitle>Today&apos;s to-do</PageTitle>
        <Paragraph className="max-w-2xl">
          What to do next in your companies, best first, priced at today&apos;s market. Tick items off to see what
          your energy is going to.
        </Paragraph>
      </header>
      {result
        ? <AdviseTodo result={result} />
        : <Paragraph>The API key has no employees, so set ADVISE_USER_ID to your user id.</Paragraph>}
    </main>
  )
}
