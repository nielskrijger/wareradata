'use server'

import { revalidatePath } from 'next/cache'

import { refreshUser } from '@/lib/scraper'

/**
 * Awaits the refresh so the button can show a pending state until the page
 * re-renders with fresh data.
 */
export async function requestUserRefresh(userId: string): Promise<void> {
  await refreshUser(userId)
  revalidatePath(`/users/${userId}`)
}
