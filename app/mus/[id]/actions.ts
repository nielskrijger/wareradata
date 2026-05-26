'use server'

import { revalidatePath } from 'next/cache'

import { refreshMuMembers } from '@/lib/scraper'

/**
 * User-initiated refresh of one MU's members. Awaits the on-demand fetch (so the
 * client can show a pending state until it's done), then revalidates the MU page
 * so it re-renders against the freshly updated in-memory snapshot.
 */
export async function requestMuRefresh(muId: string): Promise<void> {
  await refreshMuMembers(muId)
  revalidatePath(`/mus/${muId}`)
}
