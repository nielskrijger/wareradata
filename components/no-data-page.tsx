import { PageShell } from '@/components/page-shell'

/**
 * Full-page placeholder shown when a page has no data to render — typically
 * because the periodic scrape hasn't populated Redis yet (e.g. first deploy,
 * cache wipe). Generic on purpose; not worth specializing per page.
 */
export function NoDataPage() {
  return (
    <PageShell title="No data">
      <p className="text-muted-foreground text-sm">
        No data yet — the scrape job hasn&apos;t populated the cache. Trigger the{' '}
        <code className="rounded bg-muted px-1 py-0.5">refresh-data</code> workflow.
      </p>
    </PageShell>
  )
}
