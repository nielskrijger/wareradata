'use client'

import { Loader2, RefreshCw } from 'lucide-react'
import { useTransition } from 'react'

import { RelativeTime } from '@/components/relative-time'
import { Button } from '@/components/ui/button'

interface Props {
  /**
   * The entity id handed to {@link action}.
   */
  id: string
  /**
   * Server action that re-fetches this entity on demand and revalidates its
   * page. Awaited so the button can show a pending state until fresh data lands.
   */
  action: (id: string) => Promise<void>
  /**
   * When the entity was last fetched; the "Updated …" label hides if null.
   */
  lastRefreshedAt: string | null
}

/**
 * A "last updated · refresh" control for detail-page headers (the DetailHeader
 * `aside` slot). Entity-agnostic: each page supplies its own server `action`
 * plus the entity `id`. Shared by the MU and user pages, and ready for more.
 */
export function RefreshButton({ id, action, lastRefreshedAt }: Props) {
  const [pending, startTransition] = useTransition()

  function onClick() {
    startTransition(async () => {
      await action(id)
    })
  }

  return (
    <span className="text-muted-foreground inline-flex items-center gap-2 text-xs">
      {lastRefreshedAt && (
        <span>
          Updated
          {' '}
          <RelativeTime iso={lastRefreshedAt} />
        </span>
      )}
      <Button size="xs" variant="outline" onClick={onClick} disabled={pending}>
        {pending ? <Loader2 className="size-3 animate-spin" /> : <RefreshCw className="size-3" />}
        {pending ? 'Refreshing' : 'Refresh'}
      </Button>
    </span>
  )
}
