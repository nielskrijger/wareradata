import { z } from 'zod'

const BASE_URL = process.env.WARERA_BASE_URL ?? 'https://api2.warera.io/trpc'
const API_KEY = process.env.WARERA_API_KEY

const DEFAULT_REVALIDATE_SECONDS = 300
const MAX_RATE_LIMIT_RETRIES = 5
const FALLBACK_RETRY_SECONDS = 30

// Stay under Warera's 500 req/min limit with headroom (~7.5 req/s = 450/min).
const MIN_REQUEST_INTERVAL_MS = 134

type TrpcInput = Record<string, unknown> | undefined

interface RequestOptions {
  revalidate?: number
  // Bypass Next.js fetch cache. Use for scrape jobs that must hit upstream every time.
  noCache?: boolean
}

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

const trpcSingleEnvelope = z.object({ result: z.object({ data: z.unknown() }) })
const trpcBatchEnvelope = z.array(trpcSingleEnvelope)

function buildHeaders(): Record<string, string> {
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (API_KEY) {
    headers['X-API-Key'] = API_KEY
  }
  return headers
}

function nextOptions(options: RequestOptions): RequestInit {
  if (options.noCache) {
    return { cache: 'no-store' }
  }
  return { next: { revalidate: options.revalidate ?? DEFAULT_REVALIDATE_SECONDS } }
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

let nextAllowedAt = 0
/**
 * Global pacer: serializes the *issuing* of requests (not their completion)
 * so they leave at least MIN_REQUEST_INTERVAL_MS apart. Each batch counts as
 * 1 issue since Warera applies its rate limit per HTTP request.
 */
async function awaitPacer() {
  const now = Date.now()
  const wait = nextAllowedAt - now
  nextAllowedAt = Math.max(now, nextAllowedAt) + MIN_REQUEST_INTERVAL_MS
  if (wait > 0) {
    await sleep(wait)
  }
}

/**
 * Fetches with automatic 429 backoff, honoring `Retry-After` when present.
 * Falls back to FALLBACK_RETRY_SECONDS if the header is missing.
 */
async function fetchWithRetry(url: URL, init: RequestInit, label: string): Promise<Response> {
  for (let attempt = 0; ; attempt++) {
    await awaitPacer()
    const res = await fetch(url, init)
    if (res.status !== 429 || attempt >= MAX_RATE_LIMIT_RETRIES) {
      return res
    }

    const retryAfter = Number(res.headers.get('retry-after')) || FALLBACK_RETRY_SECONDS

    console.warn(`[warera] 429 on ${label} (attempt ${attempt + 1}); waiting ${retryAfter}s`)
    await sleep(retryAfter * 1000)
  }
}

async function throwOnError(res: Response, endpoint: string): Promise<void> {
  if (res.ok) {
    return
  }
  const body = await res.text().catch(() => '')
  throw new WareraApiError(
    `Warera request failed (${res.status}): ${body.slice(0, 200)}`,
    res.status,
    endpoint,
  )
}

export async function trpcQuery<T>(
  endpoint: string,
  input: TrpcInput,
  schema: z.ZodType<T>,
  options: RequestOptions = {},
): Promise<T> {
  const url = new URL(`${BASE_URL}/${endpoint}`)
  if (input !== undefined) {
    url.searchParams.set('input', JSON.stringify(input))
  }

  const res = await fetchWithRetry(url, { headers: buildHeaders(), ...nextOptions(options) }, endpoint)
  await throwOnError(res, endpoint)

  const json = await res.json()
  const { result } = trpcSingleEnvelope.parse(json)
  return schema.parse(result.data)
}

/**
 * Bundles many calls to the same procedure into one HTTP request using tRPC's
 * batch protocol: `/<proc>,<proc>,...?batch=1&input={"0":{...},"1":{...}}`.
 * Splits long input lists into chunks of `batchSize` (default 150, the upper
 * limit before the URL gets too long for typical servers).
 * Returns one parsed result per input, in the same order.
 */
export async function trpcBatch<T>(
  procedure: string,
  inputs: TrpcInput[],
  schema: z.ZodType<T>,
  options: RequestOptions & { batchSize?: number } = {},
): Promise<T[]> {
  const batchSize = options.batchSize ?? 150
  const out: T[] = []

  for (let offset = 0; offset < inputs.length; offset += batchSize) {
    const chunk = inputs.slice(offset, offset + batchSize)
    const procedures = Array.from({ length: chunk.length }).fill(procedure).join(',')
    const inputMap: Record<string, unknown> = {}
    for (const [i, inp] of chunk.entries()) {
      inputMap[String(i)] = inp ?? {}
    }

    const url = new URL(`${BASE_URL}/${procedures}`)
    url.searchParams.set('batch', '1')
    url.searchParams.set('input', JSON.stringify(inputMap))

    const res = await fetchWithRetry(
      url,
      { headers: buildHeaders(), ...nextOptions(options) },
      `${procedure} batch`,
    )
    await throwOnError(res, procedure)

    const json = await res.json()
    const results = trpcBatchEnvelope.parse(json)
    for (const r of results) {
      out.push(schema.parse(r.result.data))
    }
  }

  return out
}
