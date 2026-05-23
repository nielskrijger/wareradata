import { z } from 'zod'

const BASE_URL = process.env.WARERA_BASE_URL ?? 'https://api2.warera.io/trpc'
const API_KEY = process.env.WARERA_API_KEY

const DEFAULT_REVALIDATE_SECONDS = 300

type TrpcInput = Record<string, unknown> | undefined

export class WareraApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly endpoint: string,
  ) {
    super(message)
    this.name = 'WareraApiError'
  }
}

// Single-method tRPC form: works against both api2.warera.io and the
// warerastats.io Gateway. The Gateway does not unwrap the {"0": ...} batch
// envelope before forwarding, so we avoid batch=1.
const trpcEnvelope = z.object({ result: z.object({ data: z.unknown() }) })

export async function trpcQuery<T>(
  endpoint: string,
  input: TrpcInput,
  schema: z.ZodType<T>,
  options: { revalidate?: number } = {},
): Promise<T> {
  const url = new URL(`${BASE_URL}/${endpoint}`)
  if (input !== undefined) {
    url.searchParams.set('input', JSON.stringify(input))
  }

  const headers: Record<string, string> = { Accept: 'application/json' }
  if (API_KEY)
    headers['X-API-Key'] = API_KEY

  const res = await fetch(url, {
    headers,
    next: { revalidate: options.revalidate ?? DEFAULT_REVALIDATE_SECONDS },
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new WareraApiError(
      `Warera request failed (${res.status}): ${body.slice(0, 200)}`,
      res.status,
      endpoint,
    )
  }

  const json = await res.json()
  const { result } = trpcEnvelope.parse(json)
  return schema.parse(result.data)
}
