'use client'

import { Loader2, RefreshCw } from 'lucide-react'
import { useTransition } from 'react'

import { RelativeTime } from '@/components/relative-time'
import { Button } from '@/components/ui/button'

import { requestMuRefresh } from './actions'

interface Props {
  muId: string
  lastRefreshedAt: string | null
}

/**
 * Shows when this MU's members were last fetched and a button to refresh them on
 * demand. The action blocks until the in-memory snapshot is updated, then the
 * page revalidates, so the freshly pending state resolves into fresh data.
 */
export function RefreshButton({ muId, lastRefreshedAt }: Props) {
  const [pending, startTransition] = useTransition()

  function onClick() {
    startTransition(async () => {
      await requestMuRefresh(muId)
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
