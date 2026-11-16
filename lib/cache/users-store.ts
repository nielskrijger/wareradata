import type { User } from '@/lib/warera/api'

import path from 'node:path'

import { dataDir } from './file-store'
import { streamNdjson, writeNdjson } from './ndjson'

/**
 * One {@link User} per line, apart from `snapshot.json` because it's by far the
 * largest collection (~84 MB).
 *
 * Never appended to: refreshes go through an in-memory overlay, so each main
 * scrape rewrites it whole.
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
 * Lets a scrape keep a user's previous profile when their fetch fails.
 */
export async function loadUsersByIds(ids: ReadonlySet<string>): Promise<Map<string, User>> {
  const out = new Map<string, User>()
  if (ids.size) {
    await streamUsers((u) => {
      if (ids.has(u._id)) {
        out.set(u._id, u)
      }
    })
  }

  return out
}

/**
 * Users with company wealth, the only ones the factory scrape visits (~2%).
 */
export async function loadFactoryOwnerIds(): Promise<string[]> {
  const ownerIds: string[] = []
  await streamUsers((u) => {
    if ((u.stats?.wealth?.companies ?? 0) > 0) {
      ownerIds.push(u._id)
    }
  })

  return ownerIds
}
