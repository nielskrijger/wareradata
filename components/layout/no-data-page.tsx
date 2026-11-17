import { Paragraph } from '@/components/paragraph'

import { PageShell } from './page-shell'

/**
 * Full-page placeholder shown when a page has no data to render — typically
 * because the scraper hasn't completed its first cycle yet (e.g. first deploy,
 * empty volume). Generic on purpose; not worth specializing per page.
 */
export function NoDataPage() {
  return (
    <PageShell title="No data" width="text">
      <Paragraph>
        No data yet, the scraper hasn&apos;t finished its first run. Check back
        in a few minutes.
      </Paragraph>
    </PageShell>
  )
}
