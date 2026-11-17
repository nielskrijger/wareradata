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
 * Renders inside the root layout, so the nav and footer stay usable.
 */
export default function ErrorPage({ error, unstable_retry }: Props) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <PageShell title="Something went wrong" width="text">
      <div className="space-y-3">
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
