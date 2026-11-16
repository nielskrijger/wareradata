import type { Metadata } from 'next'

export const SITE_NAME = 'Warera Data'

export const SITE_DESCRIPTION = 'Sortable, filterable datatables of War Era game data.'

interface PageMeta {
  /**
   * Without the site suffix; the root layout's title template adds it.
   */
  title: string
  description: string

  /**
   * Becomes the canonical URL and og:url, resolved against `metadataBase`.
   */
  path: string
}

/**
 * Builds the full `openGraph` and `twitter` objects because Next replaces a
 * parent's wholesale instead of merging them.
 */
export function pageMetadata({ title, description, path }: PageMeta): Metadata {
  const fullTitle = `${title} — ${SITE_NAME}`

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: 'website',
      siteName: SITE_NAME,
      url: path,
      title: fullTitle,
      description,
    },
    twitter: {
      card: 'summary',
      title: fullTitle,
      description,
    },
  }
}
