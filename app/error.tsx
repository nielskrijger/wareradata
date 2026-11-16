'use client'

import { useEffect } from 'react'

import { PageShell } from '@/components/layout/page-shell'
import { InternalLink } from '@/components/links'
import { Paragraph } from '@/components/paragraph'
import { Button } from '@/components/ui/button'

interface Props {
  error: Error & { digest?: string }
  unstable_retry: () => void
}

/**
 * Fallback for an unexpected error while rendering a page. Keeps the site nav
 * and footer (it renders inside the root layout) and offers a retry.
 */
export default function ErrorPage({ error, unstable_retry }: Props) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <PageShell title="Something went wrong">
      <div className="max-w-2xl space-y-3">
        <Paragraph>
          This page failed to load. Trying again usually fixes it; if it keeps
          happening, the data may be mid-update.
        </Paragraph>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => unstable_retry()}>
            Try again
          </Button>
          <InternalLink href="/countries" className="text-sm">Go to Countries</InternalLink>
        </div>
      </div>
    </PageShell>
  )
}
