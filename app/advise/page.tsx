import type { Metadata } from 'next'

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

  return data ? buildAdvice(advisorInputFromData(data, gameConfig, prices)) : null
}

/**
 * The API key owner's to-do list.
 */
export default async function AdvisePage() {
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
      {result ? <AdviseTodo result={result} /> : <Paragraph>The API key's owner has no employees yet.</Paragraph>}
    </main>
  )
}
