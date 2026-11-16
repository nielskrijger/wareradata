import type { Metadata } from 'next'

export const SITE_URL = 'https://wareradata.com'

export const SITE_NAME = 'Warera Data'

export const SITE_DESCRIPTION = 'Sortable, filterable datatables of War Era game data.'

/**
 * A static file rather than `opengraph-image`, whose file-based image Next
 * drops on any page that sets its own `openGraph`, as every page does.
 */
export const SHARE_IMAGE = {
  url: '/og-image.png',
  width: 1200,
  height: 630,
  alt: SITE_NAME,
}

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
      images: [SHARE_IMAGE],
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [SHARE_IMAGE],
    },
  }
}
