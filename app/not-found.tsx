import type { Metadata } from 'next'

import { PageShell } from '@/components/layout/page-shell'
import { InternalLink } from '@/components/links'
import { Paragraph } from '@/components/paragraph'

export const metadata: Metadata = {
  title: 'Page not found',
}

export default function NotFound() {
  return (
    <PageShell title="Page not found" width="text">
      <Paragraph>
        There is no page at this address. Go to
        {' '}
        <InternalLink href="/countries">Countries</InternalLink>
        .
      </Paragraph>
    </PageShell>
  )
}
