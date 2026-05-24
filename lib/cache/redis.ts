import { Redis } from '@upstash/redis'

/**
 * Vercel Marketplace's Upstash integration uses the legacy `KV_REST_API_*`
 * prefix (carried over from when this was Vercel KV). Pass them explicitly
 * rather than rename the env vars to the Upstash defaults.
 */
const url = process.env.KV_REST_API_URL
const token = process.env.KV_REST_API_TOKEN
if (!url || !token) {
  throw new Error('Missing KV_REST_API_URL or KV_REST_API_TOKEN env var')
}

export const redis = new Redis({ url, token })
