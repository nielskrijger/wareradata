import { connection } from 'next/server'

import { getSnapshot } from '@/lib/cache/memory'
import { sitemapFiles, sitemapIndexXml, xmlResponse } from '@/lib/sitemap'

/**
 * A hand-written index, since `generateSitemaps` fixes the file count at build
 * time and the user count is only known once the snapshot loads.
 */
export async function GET() {
  await connection()
  const snapshot = await getSnapshot()

  return xmlResponse(sitemapIndexXml([...sitemapFiles(snapshot).keys()], snapshot.scrapedAt))
}
