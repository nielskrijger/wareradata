import type { Snapshot } from '@/lib/cache/memory'

import { SITE_URL } from '@/lib/metadata'

/**
 * Well under the protocol's 50,000-URL cap so each file stays small.
 */
const USERS_PER_SITEMAP = 20_000

const LIST_PATHS = ['/countries', '/users', '/mus', '/parties', '/alliances', '/regions', '/battles', '/about']

/**
 * Every child sitemap by file name, with its paths.
 *
 * Battle pages are left out: battles end within hours, so crawlers would
 * mostly find stale pages.
 */
export function sitemapFiles(snapshot: Snapshot): Map<string, string[]> {
  const { users, countries, mus, parties, alliances } = snapshot
  const files = new Map([
    ['pages.xml', LIST_PATHS],
    ['countries.xml', countries.map(c => `/countries/${c.id}`)],
    ['mus.xml', mus.map(m => `/mus/${m.id}`)],
    ['parties.xml', parties.map(p => `/parties/${p.id}`)],
    ['alliances.xml', alliances.map(a => `/alliances/${a.id}`)],
  ])

  for (let i = 0; i * USERS_PER_SITEMAP < users.length; i++) {
    const page = users.slice(i * USERS_PER_SITEMAP, (i + 1) * USERS_PER_SITEMAP)
    files.set(`users-${i}.xml`, page.map(u => `/users/${u.id}`))
  }

  return files
}

export function sitemapIndexXml(files: string[], lastModified: string | null): string {
  const lastmod = lastModified ? `<lastmod>${lastModified}</lastmod>` : ''
  const entries = files.map(f => `<sitemap><loc>${SITE_URL}/sitemaps/${f}</loc>${lastmod}</sitemap>`)

  return xml('sitemapindex', entries)
}

export function urlSetXml(paths: string[]): string {
  return xml('urlset', paths.map(p => `<url><loc>${SITE_URL}${p}</loc></url>`))
}

function xml(root: string, entries: string[]): string {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<${root} xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</${root}>\n`
}

export function xmlResponse(body: string): Response {
  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
