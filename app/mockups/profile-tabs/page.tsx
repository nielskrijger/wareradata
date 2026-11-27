import type { Variant } from './mockup'

import { connection } from 'next/server'

import { Mockup } from './mockup'

export default async function Page({ searchParams }: { searchParams: Promise<{ v?: string }> }) {
  await connection()
  const { v } = await searchParams

  return <Mockup v={(v ?? 'now') as Variant} />
}
