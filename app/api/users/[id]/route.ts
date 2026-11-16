import { getUserById } from '@/lib/cache/users'

interface RouteContext {
  params: Promise<{ id: string }>
}

/**
 * Backs the user hover card: the row plus the ranges that heat-tint it.
 */
export async function GET(_: Request, { params }: RouteContext) {
  const { id } = await params
  const result = await getUserById(id)
  if (!result) {
    return Response.json({ error: 'not found' }, { status: 404 })
  }

  return Response.json(result)
}
