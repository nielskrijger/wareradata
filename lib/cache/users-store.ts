import type { User } from '@/lib/warera/api'

import path from 'node:path'

import { dataDir } from './file-store'
import { streamNdjson, writeNdjson } from './ndjson'

/**
 * The user file: newline-delimited JSON, one full {@link User} per line. Split
 * out of `snapshot.json` because the raw user array is by far the largest
 * collection (~84 MB / ~17k users). The snapshot build streams it into the
 * derived `UserRow[]` (and the user lookup maps) rather than holding the raw
 * array, so the big array never resides in memory alongside the built rows.
 *
 * Unlike the equipment file, this is never appended to: on-demand refreshes are
 * applied through an in-memory overlay the build merges on top (see the scraper),
 * so the file always has exactly one line per user and the next main cycle
 * rewrites it whole.
 */
export function usersNdjsonPath(): string {
  return path.join(dataDir(), 'users.ndjson')
}

/**
 * Streams the user file line by line, invoking `onUser` per record.
 */
export function streamUsers(onUser: (user: User) => void): Promise<void> {
  return streamNdjson(usersNdjsonPath(), onUser)
}

/**
 * Atomically (re)writes the user file from the freshly scraped list.
 */
export function writeUsersNdjson(users: User[]): Promise<void> {
  return writeNdjson(usersNdjsonPath(), users)
}

/**
 * Streams the user file and returns the ids of users who own company wealth —
 * the only users the factory scrape enumerates (skipping the ~98% with none).
 * Streams rather than loading the array so the slow factory pass and its CLI
 * don't pull the whole user set into memory just to filter it.
 */
export async function loadCompanyOwnerIds(): Promise<string[]> {
  const ids: string[] = []
  await streamUsers((u) => {
    if ((u.stats?.wealth?.companies ?? 0) > 0) {
      ids.push(u._id)
    }
  })
  return ids
}
