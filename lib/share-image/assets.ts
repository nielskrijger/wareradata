import { Buffer } from 'node:buffer'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

import 'server-only'

/**
 * A flag from the `flag-icons` package as a data URI, or null for an unknown code.
 */
export async function flagSrc(code: string | null): Promise<string | null> {
  if (!code || !/^[a-z]{2}$/i.test(code)) {
    return null
  }

  try {
    const file = path.join(process.cwd(), 'node_modules/flag-icons/flags/4x3', `${code.toLowerCase()}.svg`)
    const svg = await readFile(file)

    return `data:image/svg+xml;base64,${svg.toString('base64')}`
  } catch {
    return null
  }
}

/**
 * Fetches an avatar as a data URI, so a slow or missing image falls back to
 * the initial instead of failing the whole render.
 *
 * Only PNG and JPEG: Satori can't decode WebP.
 */
export async function avatarSrc(url: string | null): Promise<string | null> {
  if (!url) {
    return null
  }

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(1500) })
    const type = res.headers.get('content-type') ?? ''
    if (!res.ok || !/^image\/(?:png|jpeg)/.test(type)) {
      return null
    }

    return `data:${type};base64,${Buffer.from(await res.arrayBuffer()).toString('base64')}`
  } catch {
    return null
  }
}
