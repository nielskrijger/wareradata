import { getCountryById } from '@/lib/cache/countries'

interface RouteContext {
  params: Promise<{ id: string }>
}

/**
 * Backs the country hover card: the row plus the ranges that heat-tint it.
 */
export async function GET(_: Request, { params }: RouteContext) {
  const { id } = await params
  const result = await getCountryById(id)
  if (!result) {
    return Response.json({ error: 'not found' }, { status: 404 })
  }

  return Response.json(result)
}
