import { Loader2 } from 'lucide-react'

import { PageShell } from './page-shell'

interface Props {
  title: string
}

/**
 * Streamed by Next.js as `loading.tsx` while a route's server component
 * awaits its data. The page header matches the real page so the layout
 * doesn't jump when the real content swaps in.
 */
export function LoadingPage({ title }: Props) {
  return (
    <PageShell title={title}>
      <div className="flex h-64 items-center justify-center rounded-md border">
        <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
      </div>
    </PageShell>
  )
}
