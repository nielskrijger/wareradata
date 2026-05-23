import { PageTitle } from '@/components/page-title'

/**
 * Full-page placeholder shown when a page has no data to render — typically
 * because the periodic scrape hasn't populated Redis yet (e.g. first deploy,
 * cache wipe). Generic on purpose; not worth specializing per page.
 */
export function NoDataPage() {
  return (
    <main className="space-y-6 px-6 py-8 sm:px-8 lg:px-12">
      <header>
        <PageTitle>No data</PageTitle>
      </header>
      <p className="text-muted-foreground text-sm">
        No data yet — the scrape job hasn&apos;t populated the cache. Trigger the{' '}
        <code className="rounded bg-muted px-1 py-0.5">refresh-data</code> workflow.
      </p>
    </main>
  )
}
