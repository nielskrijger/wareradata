import { Loader2 } from 'lucide-react'

import { PageShell } from './page-shell'

interface Props {
  /**
   * Matches the real page's heading so nothing jumps when it swaps in. Detail
   * pages leave it out because the record's name isn't known yet.
   */
  title?: string
}

/**
 * Streamed by Next.js as `loading.tsx` while a route's server component
 * awaits its data.
 */
export function LoadingPage({ title }: Props) {
  const spinner = (
    <div className="flex h-64 items-center justify-center rounded-md border">
      <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
    </div>
  )

  return title
    ? <PageShell title={title}>{spinner}</PageShell>
    : <main className="px-6 py-8 sm:px-8 lg:px-12">{spinner}</main>
}
