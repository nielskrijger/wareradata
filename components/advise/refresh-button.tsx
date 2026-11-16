'use client'

import { RefreshCw } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/**
 * Re-renders the page on the server, so advice reflects what the player just did.
 */
export function RefreshButton() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() => startTransition(() => router.refresh())}
    >
      <RefreshCw aria-hidden className={cn(pending && 'animate-spin')} />
      {pending ? 'Refreshing' : 'Refresh'}
    </Button>
  )
}
