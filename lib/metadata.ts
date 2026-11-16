import type { Metadata } from 'next'

export const SITE_NAME = 'Warera Data'

export const SITE_DESCRIPTION = 'Sortable, filterable datatables of War Era game data.'

interface PageMeta {
  /**
   * Page title without the site suffix; the root layout's title template adds it.
   */
  title: string
  description: string

  /**
   * The page's own path (e.g. `/users/abc`), used as its canonical URL and
   * og:url. Resolved against the root layout's `metadataBase`.
   */
  path: string
}

/**
 * Metadata for one page: title, description, canonical URL, and matching Open
 * Graph and Twitter tags. Next replaces a parent's `openGraph` and `twitter`
 * objects wholesale rather than merging them, so every page builds the full set
 * here to keep link previews specific to the page.
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
