import { z } from 'zod'

const BASE_URL = process.env.WARERA_BASE_URL ?? 'https://api2.warera.io/trpc'
const API_KEY = process.env.WARERA_API_KEY

const DEFAULT_REVALIDATE_SECONDS = 300
const MAX_RETRIES = 5
const FALLBACK_RETRY_SECONDS = 30
const TRANSIENT_BACKOFF_SECONDS = 5
const TRANSIENT_STATUSES = new Set([500, 502, 503, 504])

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

const LOG_REQUESTS = process.env.WARERA_LOG_REQUESTS === '1'

/**
 * Fetches with automatic retry on transient failures: 429 (rate limit), 5xx
 * upstream errors, and network throws. 4xx other than 429 fall through.
 *
 * Set `WARERA_LOG_REQUESTS=1` to emit one line per request
 * (`[warera] <label> <status> <ms>`). The scrape workflow turns this on;
 * the Next.js app leaves it off to avoid spamming Vercel logs.
 */
async function fetchWithRetry(url: URL, init: RequestInit, label: string): Promise<Response> {
  for (let attempt = 0; ; attempt++) {
    await awaitPacer()
    const started = Date.now()
    let res: Response
    try {
      res = await fetch(url, init)
    } catch (err) {
      if (attempt >= MAX_RETRIES) {
        throw err
      }
      console.warn(`[warera] network error on ${label} (attempt ${attempt + 1}); retrying in ${TRANSIENT_BACKOFF_SECONDS}s`)
      await sleep(TRANSIENT_BACKOFF_SECONDS * 1000)
      continue
    }

    if (LOG_REQUESTS) {
      console.warn(`[warera] ${label} ${res.status} ${Date.now() - started}ms`)
    }

    if (res.status === 429) {
      if (attempt >= MAX_RETRIES) {
        return res
      }
      const retryAfter = Number(res.headers.get('retry-after')) || FALLBACK_RETRY_SECONDS
      console.warn(`[warera] 429 on ${label} (attempt ${attempt + 1}); waiting ${retryAfter}s`)
      await sleep(retryAfter * 1000)
      continue
    }

    if (TRANSIENT_STATUSES.has(res.status) && attempt < MAX_RETRIES) {
      console.warn(`[warera] ${res.status} on ${label} (attempt ${attempt + 1}); retrying in ${TRANSIENT_BACKOFF_SECONDS}s`)
      await sleep(TRANSIENT_BACKOFF_SECONDS * 1000)
      continue
    }

    return res
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
