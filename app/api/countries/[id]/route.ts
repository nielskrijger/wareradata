import { getCountryById } from '@/lib/cache/countries'

interface RouteContext {
  params: Promise<{ id: string }>
}

/**
 * Single-country lookup, returns the projected CountryRow plus the leaderboard
 * ranges needed to heat-tint the hover-card tooltip (the data backbone of
 * `<CountryHoverCard>`). Reads from the warm in-memory snapshot via the
 * `lib/cache/countries` accessor.
 */
export async function GET(_: Request, { params }: RouteContext) {
  const { id } = await params
  const result = await getCountryById(id)
  if (!result) {
    return Response.json({ error: 'not found' }, { status: 404 })
  }

  return Response.json(result)
}
