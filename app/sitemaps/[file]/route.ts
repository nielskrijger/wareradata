import { connection } from 'next/server'

import { getSnapshot } from '@/lib/cache/memory'
import { sitemapFiles, urlSetXml, xmlResponse } from '@/lib/sitemap'

interface RouteContext {
  params: Promise<{ file: string }>
}

export async function GET(_: Request, { params }: RouteContext) {
  await connection()
  const { file } = await params
  const paths = sitemapFiles(await getSnapshot()).get(file)
  if (!paths) {
    return new Response('Not found', { status: 404 })
  }

  return xmlResponse(urlSetXml(paths))
}
