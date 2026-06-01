'use server'

import { revalidatePath } from 'next/cache'

import { refreshUser } from '@/lib/scraper'

/**
 * User-initiated refresh of one player's profile + equipment. Awaits the
 * on-demand fetch (so the client can show a pending state until it's done), then
 * revalidates the user page so it re-renders against the updated in-memory
 * snapshot.
 */
export async function requestUserRefresh(userId: string): Promise<void> {
  await refreshUser(userId)
  revalidatePath(`/users/${userId}`)
}
