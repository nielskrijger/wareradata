import { getUserById } from '@/lib/cache/users'

interface RouteContext {
  params: Promise<{ id: string }>
}

/**
 * Single-user lookup, returns the projected UserRow plus the leaderboard
 * ranges needed to heat-tint the hover-card tooltip (the data backbone of
 * `<UserHoverCard>`). Reads from the warm in-memory snapshot via the
 * `lib/cache/users` accessor.
 */
export async function GET(_: Request, { params }: RouteContext) {
  const { id } = await params
  const result = await getUserById(id)
  if (!result) {
    return Response.json({ error: 'not found' }, { status: 404 })
  }
  return Response.json(result)
}
