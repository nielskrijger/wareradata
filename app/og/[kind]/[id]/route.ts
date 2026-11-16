import { connection } from 'next/server'

import { renderShareImage } from '@/lib/share-image/cards'

interface RouteContext {
  params: Promise<{ kind: string, id: string }>
}

export async function GET(_: Request, { params }: RouteContext) {
  await connection()
  const { kind, id } = await params

  return await renderShareImage(kind, id) ?? new Response('Not found', { status: 404 })
}
