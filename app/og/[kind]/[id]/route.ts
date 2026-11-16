import { connection } from 'next/server'

import { shareCard } from '@/lib/share-image/cards'
import { renderShareImage } from '@/lib/share-image/render'

interface RouteContext {
  params: Promise<{ kind: string, id: string }>
}

export async function GET(_: Request, { params }: RouteContext) {
  await connection()
  const { kind, id } = await params
  const card = await shareCard(kind, id)
  if (!card) {
    return new Response('Not found', { status: 404 })
  }

  return renderShareImage(card)
}
