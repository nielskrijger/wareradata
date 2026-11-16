import { notFound, redirect } from 'next/navigation'
import { connection } from 'next/server'

import { getKeyOwnerId } from '@/lib/warera/api'

/**
 * Short link to the API key owner's to-do list.
 */
export default async function AdviseRedirect() {
  await connection()
  const userId = await getKeyOwnerId()
  if (!userId) {
    notFound()
  }

  redirect(`/users/${userId}/advise`)
}
